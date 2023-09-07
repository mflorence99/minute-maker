import { AddRecent } from '#mm/state/recents';
import { AppState } from '#mm/state/app';
import { AppStateModel } from '#mm/state/app';
import { AudioMetadataService } from '#mm/services/audio-metadata';
import { Channels } from '#mm/common';
import { Clear as ClearUndoStacks } from '#mm/state/undo';
import { ClearMinutes } from '#mm/state/minutes';
import { ClearStatus } from '#mm/state/status';
import { ConfigState } from '#mm/state/config';
import { ConfigStateModel } from '#mm/state/config';
import { Constants } from '#mm/common';
import { DialogService } from '#mm/services/dialog';
import { ExporterService } from '#mm/services/exporter';
import { FSService } from '#mm/services/fs';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { MinutesSchema } from '#mm/common';
import { MinutesState } from '#mm/state/minutes';
import { MinutesStateModel } from '#mm/state/minutes';
import { OpenAIService } from '#mm/services/openai';
import { RephraseStrategy } from '#mm/common';
import { SetMinutes } from '#mm/state/minutes';
import { SetPathToMinutes } from '#mm/state/app';
import { SetStatus } from '#mm/state/status';
import { Store } from '@ngxs/store';
import { Summary } from '#mm/common';
import { SummaryStrategy } from '#mm/common';
import { TranscriberRequest } from '#mm/common';
import { TranscriberService } from '#mm/services/transcriber';
import { Transcription } from '#mm/common';
import { UpdateTranscription } from '#mm/state/minutes';
import { UploaderService } from '#mm/services/uploader';
import { Working } from '#mm/state/status';

import { catchError } from 'rxjs';
import { combineLatest } from 'rxjs';
import { emptyMinutes } from '#mm/common';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { of } from 'rxjs';
import { takeWhile } from 'rxjs';
import { tap } from 'rxjs';
import { throttleTime } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// 🙈 preload.ts
declare const ipc /* 👈 typeof ipcRenderer */;

@Injectable({ providedIn: 'root' })
export class ControllerService {
  #dialog = inject(DialogService);
  #exporter = inject(ExporterService);
  #fs = inject(FSService);
  #metadata = inject(AudioMetadataService);
  #openai = inject(OpenAIService);
  #store = inject(Store);
  #transcriber = inject(TranscriberService);
  #uploader = inject(UploaderService);

  // //////////////////////////////////////////////////////////////////////////
  // 🟫 Initialization
  // //////////////////////////////////////////////////////////////////////////

  constructor() {
    // 👇 load the last-used minutes, if any
    const app = this.#store.selectSnapshot<AppStateModel>(AppState);
    const path = app.pathToMinutes;
    if (path) this.#loadMinutes(path).then(() => this.#ready());
    else this.#ready();
    // 👇 monitor state changes
    this.#monitorAppQuit();
    this.#saveMinutesPeriodically();
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 CancelTranscription
  // //////////////////////////////////////////////////////////////////////////

  async cancelTranscription(): Promise<void> {
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    if (minutes.transcriptionName) {
      await this.#transcriber.cancelTranscription(minutes.transcriptionName);
      this.#store.dispatch([
        new SetMinutes({
          transcriptionName: null
        }),
        new ClearStatus(new Working('transcription'))
      ]);
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 CancelWorking
  // //////////////////////////////////////////////////////////////////////////

  async cancelWorking(working: Working): Promise<void> {
    const button = await this.#dialog.showMessageBox({
      buttons: ['Proceed', 'Cancel'],
      message: `This action will cancel the ${working.on} currently running in the background. Are you sure you wish to proceed?`,
      title: 'Minute Maker',
      type: 'question'
    });
    if (button === 1) return;
    try {
      await working.canceledBy();
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    } finally {
      // 🔥 maybe rely on canceledBy implementation to clear status?
      // this.#store.dispatch(new ClearStatus());
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 CloseMinutes
  // //////////////////////////////////////////////////////////////////////////

  closeMinutes(): void {
    this.saveMinutes().then(() => {
      this.#store.dispatch([
        new SetPathToMinutes(null),
        new ClearMinutes(),
        new ClearUndoStacks()
      ]);
    });
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 ExportMinutes
  // //////////////////////////////////////////////////////////////////////////

  exportMinutes(): void {
    this.#exporter.export(this.#store.selectSnapshot<Minutes>(MinutesState));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 NewMinutes
  // //////////////////////////////////////////////////////////////////////////

  async newMinutes(): Promise<void> {
    const working = new Working('upload');
    const app = this.#store.selectSnapshot<AppStateModel>(AppState);
    // 🔥 locked into MP3 only for now
    const path = await this.#fs.chooseFile({
      defaultPath: app.pathToMinutes,
      filters: [{ extensions: ['mp3'], name: 'Audio Recording' }],
      title: 'Open Audio Recording'
    });
    if (path) {
      this.#store.dispatch(
        new SetStatus({
          status: 'Uploading audio recording',
          working
        })
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
          ...emptyMinutes(),
          audio: {
            duration: metadata.duration,
            encoding: metadata.encoding,
            gcsuri: upload.gcsuri,
            sampleRateHertz: metadata.sampleRate,
            url: upload.url
          }
        };
        this.#store.dispatch([
          new SetPathToMinutes(null),
          new SetMinutes(minutes)
        ]);
        // 👇 clear the undo stacks as this is new data
        this.#store.dispatch(new ClearUndoStacks());
      } catch (error) {
        this.#store.dispatch(new SetStatus({ error }));
      } finally {
        this.#store.dispatch(new ClearStatus(working));
      }
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 OpenMinutes
  // //////////////////////////////////////////////////////////////////////////

  async openMinutes(path = null): Promise<void> {
    const app = this.#store.selectSnapshot<AppStateModel>(AppState);
    if (!path) {
      path = await this.#fs.chooseFile({
        defaultPath: app.pathToMinutes,
        filters: [{ extensions: ['json'], name: 'Minutes' }],
        title: 'Open Minutes'
      });
    }
    if (path) {
      // 👇 make sure we can't save while the minutes are loading
      this.#store.dispatch(new SetPathToMinutes(null));
      const minutes = await this.#loadMinutes(path);
      if (minutes) this.#store.dispatch(new SetPathToMinutes(path));
      // 👇 clear the undo stacks as this is new data
      this.#store.dispatch(new ClearUndoStacks());
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 RephraseTranscription (via OpenAI)
  // //////////////////////////////////////////////////////////////////////////

  async rephraseTranscription(
    rephraseStrategy: RephraseStrategy,
    ix: number
  ): Promise<void> {
    const working = new Working('rephrase');
    const config = this.#store.selectSnapshot<ConfigStateModel>(ConfigState);
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    this.#store.dispatch(
      new SetStatus({
        ix,
        status: 'Rephrasing transcription',
        working
      })
    );
    try {
      const speech = this.#pluckTranscription(minutes, ix).speech;
      const response = await this.#openai.chatCompletion({
        prompt: `${config.rephraseStrategyPrompts[rephraseStrategy]}:\n\n${speech}`
      });
      if (response.finish_reason === 'length')
        throw new Error('This speech is too long to rephrase');
      else if (response.finish_reason !== 'stop')
        throw new Error(response.finish_reason);
      else
        this.#store.dispatch(
          new UpdateTranscription({ speech: response.text }, ix)
        );
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    } finally {
      this.#store.dispatch(new ClearStatus(working));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SaveMinutes
  // //////////////////////////////////////////////////////////////////////////

  async saveMinutes(saveAs = false): Promise<void> {
    const app = this.#store.selectSnapshot<AppStateModel>(AppState);
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    if (minutes) {
      let path = app.pathToMinutes;
      if (saveAs || !path) {
        path = await this.#fs.saveFileAs(JSON.stringify(minutes, null, 2), {
          defaultPath: path,
          filters: [{ extensions: ['json'], name: 'Minutes' }],
          title: 'Save Minutes'
        });
        if (path) this.#store.dispatch(new SetPathToMinutes(path));
      } else await this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 SummarizeMinutes (via OpenAI)
  // //////////////////////////////////////////////////////////////////////////

  async summarizeMinutes(summaryStrategy: SummaryStrategy): Promise<void> {
    const working = new Working('summary');
    const config = this.#store.selectSnapshot<ConfigStateModel>(ConfigState);
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    if (minutes.summary.length > 0) {
      // 👇 warn about overwrite
      const button = await this.#dialog.showMessageBox({
        buttons: ['Proceed', 'Cancel'],
        message:
          'This action will overwrite the existing summary and cannot be undone. Are you sure you wish to proceed?',
        title: 'Minute Maker',
        type: 'question'
      });
      if (button === 1) return;
    }
    // 👇 prepare to summarize
    this.#store.dispatch(
      new SetStatus({
        status: 'Summarizing minutes',
        working
      })
    );
    // 👇 first, just attach a section to each transcription where the
    //    section is the most recent agenda item
    let section = '';
    const withSections = minutes.transcription.reduce((acc, tx) => {
      if (tx.type === 'AG') section = tx.title;
      else if (tx.type === 'TX' && tx.speaker) acc.push({ section, tx });
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
        else if (response.finish_reason !== 'stop')
          throw new Error(response.finish_reason);
        else summary.push({ section, summary: response.text });
      }
      this.#store.dispatch(new SetMinutes({ summary }));
    } catch (error) {
      this.#store.dispatch(new SetStatus({ error }));
    } finally {
      this.#store.dispatch(new ClearStatus(working));
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 TranscribeAudio (via Google speech-to-text)
  // //////////////////////////////////////////////////////////////////////////

  async transcribeAudio(): Promise<void> {
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    // 👇 warn about overwrite
    if (minutes.transcription.length > 0) {
      const button = await this.#dialog.showMessageBox({
        buttons: ['Proceed', 'Cancel'],
        message:
          'This action will overwrite the existing transcription and cannot be undone. Are you sure you wish to proceed?',
        title: 'Minute Maker',
        type: 'question'
      });
      if (button === 1) return;
    }
    // 👇 construct request
    const request = {
      audio: { ...minutes.audio },
      numSpeakers: minutes.numSpeakers,
      phrases: [
        minutes.subject,
        minutes.subtitle,
        minutes.title,
        ...minutes.absent,
        ...minutes.present,
        ...minutes.visitors
      ]
    } as TranscriberRequest;
    // 👇 immediately show start of transcription
    this.#store.dispatch([
      new SetMinutes({ transcriptionStart: new Date() }),
      new SetStatus({
        status: 'Transcribing audio',
        working: new Working('transcription')
      })
    ]);
    // 👇 initiate transcription
    const transcriptionName =
      await this.#transcriber.startTranscription(request);
    // 👇 transcription isn't cancelable until we know the transcription name
    this.#store.dispatch(new SetMinutes({ transcriptionName }));
    // 👇 now start polling for completion
    this.transcribeAudioPoll();
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 TranscribeAudioPoll (via Google speech-to-text)
  //    NOTE: we can enter here from #loadMinutes
  // //////////////////////////////////////////////////////////////////////////

  transcribeAudioPoll(): void {
    const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
    // 👇 quick exit if nothing to do
    if (!minutes.transcriptionName) return;
    // 👇 transcription isn't cancelable until we know the transcription name
    this.#store.dispatch(
      new SetStatus({
        status: 'Transcribing audio',
        working: new Working('transcription', () => this.cancelTranscription())
      })
    );
    // 👇 poll transcription and note progress as status
    combineLatest({
      tx: this.#transcriber.pollTranscription(minutes.transcriptionName),
      name: this.#store.select(MinutesState.transcriptionName)
    })
      .pipe(
        takeWhile(({ name }) => name === minutes.transcriptionName),
        catchError((error) => {
          this.#store.dispatch(new SetStatus({ error }));
          return of({ tx: null });
        }),
        tap(({ tx }) => {
          if (tx)
            this.#store.dispatch([
              new SetStatus({
                status: `Transcribing audio: ${tx.progressPercent}% complete`,
                working: new Working('transcription', () =>
                  this.cancelTranscription()
                )
              })
            ]);
        }),
        filter(({ tx }) => tx.progressPercent === 100)
      )
      .subscribe(({ tx }) => {
        if (tx) {
          let nextTranscriptionID = minutes.nextTranscriptionID ?? 0;
          // 👇 make sure they're typed right and propery ID'd
          tx.transcription.forEach((t) => {
            t.id = ++nextTranscriptionID;
            t.type = 'TX';
          });
          // 👇 finally
          this.#store.dispatch([
            new SetMinutes({
              nextTranscriptionID,
              transcription: tx.transcription,
              transcriptionName: null
            }),
            new ClearStatus(new Working('transcription'))
          ]);
        }
      });
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟦 helper methods
  // //////////////////////////////////////////////////////////////////////////

  async #loadMinutes(path: string): Promise<Minutes> {
    let minutes: Minutes;
    try {
      const raw = await this.#fs.loadFile(path);
      minutes = MinutesSchema.parse(JSON.parse(raw));
      if (minutes) {
        this.#store.dispatch([
          new SetMinutes({ ...emptyMinutes(), ...minutes }),
          new AddRecent(path)
        ]);
        // 👇 in case transcription was in progress, poll for its completion
        this.transcribeAudioPoll();
      }
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
    return minutes;
  }

  #monitorAppQuit(): void {
    // 👇 save the minutes before quitting
    ipc.on(Channels.appBeforeQuit, async () => {
      const app = this.#store.selectSnapshot<AppStateModel>(AppState);
      const minutes = this.#store.selectSnapshot<Minutes>(MinutesState);
      if (app.pathToMinutes)
        await this.#fs.saveFile(
          app.pathToMinutes,
          JSON.stringify(minutes, null, 2)
        );
      ipc.send(Channels.appQuit);
    });
  }

  #pluckTranscription(state: MinutesStateModel, ix: number): Transcription {
    if (state.transcription[ix].type === 'TX')
      return state.transcription[ix] as Transcription;
    else throw new Error(`Operation not supported for item #${ix}`);
  }

  #ready(): void {
    const root = document.querySelector('mm-root');
    root.classList.add('ready');
  }

  #saveMinutesPeriodically(): void {
    const minutes$ = this.#store.select(MinutesState);
    minutes$
      .pipe(
        map((minutes) => {
          // 👇 we'll use the snapshot b/c who knows where we are now
          const app = this.#store.selectSnapshot<AppStateModel>(AppState);
          return [minutes, app.pathToMinutes];
        }),
        filter(([minutes, path]) => !!(minutes && path)),
        throttleTime(Constants.saveFileThrottleInterval, undefined, {
          leading: true,
          trailing: true
        })
      )
      .subscribe(([minutes, path]) => {
        this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
      });
  }
}
