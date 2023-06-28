import { Action } from '@ngxs/store';
import { AddRecent } from '#mm/state/recents';
import { Channels } from '#mm/common';
import { ClearStatus } from '#mm/state/status';
import { ConfigState } from '#mm/state/config';
import { ConfigStateModel } from '#mm/state/config';
import { Constants } from '#mm/common';
import { FSService } from '#mm/services/fs';
import { Injectable } from '@angular/core';
import { MetadataService } from '#mm/services/metadata';
import { Minutes } from '#mm/common';
import { MinutesSchema } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { NgxsOnInit } from '@ngxs/store';
import { OpenAIService } from '#mm/services/openai';
import { RephraseStrategy } from '#mm/common';
import { SetMinutes } from '#mm/state/minutes';
import { SetStatus } from '#mm/state/status';
import { State } from '@ngxs/store';
import { StateContext } from '@ngxs/store';
import { Store } from '@ngxs/store';
import { TranscriberRequest } from '#mm/common';
import { TranscriberService } from '#mm/services/transcriber';
import { UpdateTranscription } from '#mm/state/minutes';
import { UploaderService } from '#mm/services/uploader';

import { catchError } from 'rxjs';
import { debounceTime } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { of } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { pluckTranscription } from '#mm/utils';
import { tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

export class CancelTranscription {
  static readonly type = '[App] CancelTranscription';
  constructor() {}
}

export class NewMinutes {
  static readonly type = '[App] NewMinutes';
  constructor() {}
}

export class OpenMinutes {
  static readonly type = '[App] OpenMinutes';
  constructor() {}
}

export class SaveMinutes {
  static readonly type = '[App] SaveMinutes';
  constructor(public saveAs = false) {}
}

export class RephraseTranscription {
  static readonly type = '[App] RephraseTranscription';
  constructor(public rephraseStrategy: RephraseStrategy, public ix: number) {}
}

export class TranscribeMinutes {
  static readonly type = '[App] TranscribeMinutes';
  constructor() {}
}

export type AppStateModel = {
  pathToMinutes: string;
  transcriptionName: string;
};

@State<AppStateModel>({
  name: 'app',
  defaults: {
    pathToMinutes: null,
    transcriptionName: null
  }
})
@Injectable()
export class AppState implements NgxsOnInit {
  #fs = inject(FSService);
  #metadata = inject(MetadataService);
  #openai = inject(OpenAIService);
  #store = inject(Store);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 CancelTranscription
  // //////////////////////////////////////////////////////////////////////////

  @Action(CancelTranscription) async cancelTranscription({
    getState
  }: StateContext<AppStateModel>): Promise<void> {
    const transcriptionName = getState().transcriptionName;
    if (transcriptionName) {
      await this.#transcriber.cancelTranscription({ name: transcriptionName });
      this.#store.dispatch(new ClearStatus());
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 NewMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(NewMinutes) async newMinutes({
    getState,
    setState
  }: StateContext<AppStateModel>): Promise<void> {
    // 🔥 locked into MP3 only for now
    const path = await this.#fs.chooseFile({
      defaultPath: getState().pathToMinutes,
      filters: [{ extensions: ['mp3'], name: 'Audio Recording' }],
      title: 'Open Audio Recording'
    });
    if (path) {
      this.#store.dispatch(
        new SetStatus({ status: 'Uploading audio recording', working: true })
      );
      try {
        const config =
          this.#store.selectSnapshot<ConfigStateModel>(ConfigState);
        // 👇 extract the audio metadata
        const metadata = await this.#metadata.parseFile(path);
        // 👇 upload the audio to GCS
        const upload = await this.#uploader.upload({
          bucketName: config.bucketName,
          destFileName: `${uuidv4()}.mp3`,
          filePath: path
        });
        // 👇 construct a bare-bones Minutes
        const minutes: Minutes = {
          audio: {
            encoding: metadata.encoding,
            gcsuri: upload.gcsuri,
            sampleRateHertz: metadata.sampleRate,
            url: upload.url
          },
          date: new Date(),
          title: '--Untitled--'
        };
        setState(patch({ pathToMinutes: null }));
        this.#store.dispatch(new SetMinutes(minutes));
      } catch (error) {
        this.#store.dispatch(new SetStatus({ error }));
      } finally {
        this.#store.dispatch(new ClearStatus());
      }
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 OpenMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(OpenMinutes) async openMinutes({
    getState,
    setState
  }: StateContext<AppStateModel>): Promise<void> {
    const path = await this.#fs.chooseFile({
      defaultPath: getState().pathToMinutes,
      filters: [{ extensions: ['json'], name: 'Minutes' }],
      title: 'Open Minutes'
    });
    if (path) {
      setState(patch({ pathToMinutes: path }));
      this.#loadMinutes(path);
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 RephraseTranscription (via OpenAI)
  // //////////////////////////////////////////////////////////////////////////

  @Action(RephraseTranscription) async rephraseTranscription(
    ctx: StateContext<AppStateModel>,
    { rephraseStrategy, ix }: RephraseTranscription
  ): Promise<void> {
    const config = this.#store.selectSnapshot<ConfigStateModel>(ConfigState);
    const minutes = this.#store.selectSnapshot<MinutesStateModel>(MinutesState);
    this.#store.dispatch(
      new SetStatus({ status: 'Rephrasing transcription', working: true })
    );
    try {
      const speech = pluckTranscription(minutes, ix).speech;
      const response = await this.#openai.chatCompletion({
        prompt: `${config.rephraseStrategyPrompts[rephraseStrategy]}:\n\n${speech}`
      });
      if (response.finish_reason === 'length')
        throw new Error('This speech is too long to rephrase');
      this.#store.dispatch(
        new UpdateTranscription({ speech: response.text }, ix)
      );
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    } finally {
      this.#store.dispatch(new ClearStatus());
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SaveMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(SaveMinutes) async saveMinutes(
    { getState, setState }: StateContext<AppStateModel>,
    { saveAs }: SaveMinutes
  ): Promise<void> {
    const minutes = this.#store.selectSnapshot<MinutesStateModel>(MinutesState);
    let path = getState().pathToMinutes;
    if (saveAs || !path) {
      path = await this.#fs.saveFileAs(JSON.stringify(minutes), {
        defaultPath: getState().pathToMinutes,
        filters: [{ extensions: ['json'], name: 'Minutes' }],
        title: 'Save Minutes'
      });
      setState(patch({ pathToMinutes: path }));
    } else await this.#fs.saveFile(path, JSON.stringify(minutes));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 TranscribeMinutes (via Google speech-to-text)
  // //////////////////////////////////////////////////////////////////////////

  @Action(TranscribeMinutes) transcribeMinutes({
    setState
  }: StateContext<AppStateModel>): void {
    const minutes = this.#store.selectSnapshot<MinutesStateModel>(MinutesState);
    const request = {
      audio: { ...minutes.audio },
      speakers: minutes.speakers
    } as TranscriberRequest;
    this.#store.dispatch(
      new SetStatus({ status: 'Transcribing minutes', working: true })
    );
    this.#transcriber
      .transcribe(request)
      .pipe(
        tap((tx) => {
          setState(patch({ transcriptionName: tx.name }));
          this.#store.dispatch(
            new SetStatus({
              status: `Transcribing minutes: ${tx.progressPercent}% complete`
            })
          );
        }),
        filter((tx) => tx.progressPercent === 100),
        catchError((error) => {
          this.#store.dispatch(new SetStatus({ error }));
          return of(null);
        })
      )
      .subscribe((tx) => {
        if (tx) {
          let nextTranscriptionID = minutes.nextTranscriptionID ?? 0;
          // 👇 make sure they're typed right and propery ID'd
          tx.transcription.forEach((t) => {
            t.id = ++nextTranscriptionID;
            t.type = 'TX';
          });
          this.#store.dispatch(
            new SetMinutes({
              nextTranscriptionID,
              transcription: tx.transcription
            })
          );
          // 👇 finally
          setState(patch({ transcriptionName: null }));
          this.#store.dispatch(new ClearStatus());
        }
      });
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟫 Initialization
  // //////////////////////////////////////////////////////////////////////////

  ngxsOnInit({ getState }): void {
    // 👇 load the last-used minutes, if any
    const path = getState().pathToMinutes;
    if (path) this.#loadMinutes(path);
    // 👇 save the minutes before quitting
    ipc.on(Channels.appBeforeQuit, async () => {
      const minutes =
        this.#store.selectSnapshot<MinutesStateModel>(MinutesState);
      const state = this.#store.selectSnapshot<AppStateModel>(AppState);
      if (state.pathToMinutes)
        await this.#fs.saveFile(state.pathToMinutes, JSON.stringify(minutes));
      ipc.send(Channels.appQuit);
    });
    // 👇 save the minutes periodically
    const minutes$ = this.#store.select(MinutesState);
    minutes$
      .pipe(
        map((minutes) => {
          // 👇 we'll use the snapshot b/c who knows where we are now
          const state = this.#store.selectSnapshot<AppStateModel>(AppState);
          return [minutes, state.pathToMinutes];
        }),
        filter(([minutes, path]) => !!(minutes && path)),
        debounceTime(Constants.saveFileInterval)
      )
      .subscribe(([minutes, path]) => {
        this.#fs.saveFile(path, JSON.stringify(minutes));
      });
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 helper methods
  // //////////////////////////////////////////////////////////////////////////

  async #loadMinutes(path: string): Promise<void> {
    try {
      const raw = await this.#fs.loadFile(path);
      const minutes: Minutes = MinutesSchema.parse(JSON.parse(raw));
      this.#store.dispatch([new SetMinutes(minutes), new AddRecent(path)]);
    } catch (error) {
      this.#store.dispatch(
        new SetStatus({
          error: {
            message:
              'The minutes file must be valid JSON, as created by this application'
          }
        })
      );
    }
  }
}
