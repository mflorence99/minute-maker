import { Action } from '@ngxs/store';
import { AddRecent } from '#mm/state/recents';
import { Channels } from '#mm/common';
import { Clear as ClearUndoStacks } from '#mm/state/undo';
import { ClearMinutes } from '#mm/state/minutes';
import { ClearStatus } from '#mm/state/status';
import { ConfigState } from '#mm/state/config';
import { ConfigStateModel } from '#mm/state/config';
import { Constants } from '#mm/common';
import { ExporterService } from '#mm/services/exporter';
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
import { Summary } from '#mm/common';
import { SummaryStrategy } from '#mm/common';
import { TranscriberRequest } from '#mm/common';
import { TranscriberService } from '#mm/services/transcriber';
import { Transcription } from '#mm/common';
import { UpdateTranscription } from '#mm/state/minutes';
import { UploaderService } from '#mm/services/uploader';

import { catchError } from 'rxjs';
import { debounceTime } from 'rxjs';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { of } from 'rxjs';
import { patch } from '@ngxs/store/operators';
import { tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

export class CancelTranscription {
  static readonly type = '[App] CancelTranscription';
  constructor() {}
}

export class CloseMinutes {
  static readonly type = '[App] CloseMinutes';
  constructor() {}
}

export class ExportMinutes {
  static readonly type = '[App] ExportMinutes';
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

export class SummarizeMinutes {
  static readonly type = '[App] SummarizeMinutes';
  constructor(public summaryStrategy: SummaryStrategy) {}
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
  #exporter = inject(ExporterService);
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
  // 🟩 CloseMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(CloseMinutes) closeMinutes({
    setState
  }: StateContext<AppStateModel>): void {
    this.#store.dispatch(new SaveMinutes()).subscribe(() => {
      this.#store.dispatch(new ClearMinutes());
      setState(patch({ pathToMinutes: null }));
    });
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 ExportMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(ExportMinutes) exportMinutes(): void {
    this.#exporter.export();
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
        // 👇 clear the undo stacks as this is new data
        this.#store.dispatch(new ClearUndoStacks());
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
      // 👇 clear the undo stacks as this is new data
      this.#store.dispatch(new ClearUndoStacks());
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
      const speech = this.#pluckTranscription(minutes, ix).speech;
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
      path = await this.#fs.saveFileAs(JSON.stringify(minutes, null, 2), {
        defaultPath: getState().pathToMinutes,
        filters: [{ extensions: ['json'], name: 'Minutes' }],
        title: 'Save Minutes'
      });
      if (path) setState(patch({ pathToMinutes: path }));
    } else await this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SummarizeMinutes (via OpenAI)
  // //////////////////////////////////////////////////////////////////////////

  @Action(SummarizeMinutes) async summarizeMinutes(
    ctx: StateContext<AppStateModel>,
    { summaryStrategy }: SummarizeMinutes
  ): Promise<void> {
    const config = this.#store.selectSnapshot<ConfigStateModel>(ConfigState);
    const minutes = this.#store.selectSnapshot<MinutesStateModel>(MinutesState);
    this.#store.dispatch(
      new SetStatus({ status: 'Summarizing minutes', working: true })
    );
    // 👇 first, just attach a section to each transcription where the
    //    section is the most recent agenda item
    let section = '';
    const withSections = minutes.transcription.reduce((acc, tx) => {
      if (tx.type === 'AG') section = tx.title;
      else if (tx.type === 'TX') acc.push({ section, tx });
      return acc;
    }, []);
    // 👇 create raw summaries of minutes by section
    const bySection: Record<string, Transcription[]> = withSections.reduce(
      (acc, withSection) => {
        const { section, tx } = withSection;
        acc[section] = acc[section] ?? [];
        acc[section].push(`${tx.speaker} says: ${tx.speech}`);
        return acc;
      },
      {}
    );
    // 👇 perform the summary for each section
    try {
      const summary: Summary[] = [];
      for (const [section, texts] of Object.entries(bySection)) {
        const response = await this.#openai.chatCompletion({
          prompt: `${
            config.summaryStrategyPrompts[summaryStrategy]
          }:\n\n${texts.join('\n')}`
        });
        if (response.finish_reason === 'length')
          throw new Error('This section is too long to rephrase');
        summary.push({ section, summary: response.text });
      }
      this.#store.dispatch(new SetMinutes({ summary }));
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    } finally {
      this.#store.dispatch(new ClearStatus());
    }
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
      numSpeakers: minutes.numSpeakers
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
        await this.#fs.saveFile(
          state.pathToMinutes,
          JSON.stringify(minutes, null, 2)
        );
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
        this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
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
      console.error(error);
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

  #pluckTranscription(state: MinutesStateModel, ix: number): Transcription {
    if (state.transcription[ix].type === 'TX')
      return state.transcription[ix] as any as Transcription;
    else throw new Error(`Operation not supported for item #${ix}`);
  }
}
