import { AddRecent } from '#mm/state/recents';
import { AppState } from '#mm/state/app';
import { AudioMetadataService } from '#mm/services/audio-metadata';
import { Channels } from '#mm/common';
import { Clear as ClearUndoStacks } from '#mm/state/undo';
import { ClearMinutes } from '#mm/state/minutes';
import { ClearStatus } from '#mm/state/status';
import { ComponentState } from '#mm/state/component';
import { ConfigState } from '#mm/state/config';
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
import { SetComponentState } from '#mm/state/component';
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
import { debounceTime } from 'rxjs';
import { emptyMinutes } from '#mm/common';
import { filter } from 'rxjs';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { of } from 'rxjs';
import { tap } from 'rxjs';
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
    const app = this.#store.selectSnapshot(AppState);
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
    const transcriptionName =
      this.#store.selectSnapshot(ComponentState).transcriptionName;
    if (transcriptionName) {
      await this.#transcriber.cancelTranscription(transcriptionName);
      this.#store.dispatch(new ClearStatus());
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
      this.#store.dispatch(new ClearStatus());
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
    this.#exporter.export(this.#store.selectSnapshot(MinutesState));
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 NewMinutes
  // //////////////////////////////////////////////////////////////////////////

  async newMinutes(): Promise<void> {
    const app = this.#store.selectSnapshot(AppState);
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
          working: new Working('upload')
        })
      );
      try {
        const config = this.#store.selectSnapshot(ConfigState);
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
        this.#store.dispatch(new ClearStatus());
      }
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 OpenMinutes
  // //////////////////////////////////////////////////////////////////////////

  async openMinutes(path = null): Promise<void> {
    const app = this.#store.selectSnapshot(AppState);
    if (!path) {
      path = await this.#fs.chooseFile({
        defaultPath: app.pathToMinutes,
        filters: [{ extensions: ['json'], name: 'Minutes' }],
        title: 'Open Minutes'
      });
    }
    if (path) {
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
    const config = this.#store.selectSnapshot(ConfigState);
    const minutes = this.#store.selectSnapshot(MinutesState);
    this.#store.dispatch(
      new SetStatus({
        ix,
        status: 'Rephrasing transcription',
        working: new Working('rephrase')
      })
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

  async saveMinutes(saveAs = false): Promise<void> {
    const app = this.#store.selectSnapshot(AppState);
    const minutes = this.#store.selectSnapshot(MinutesState);
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
    const config = this.#store.selectSnapshot(ConfigState);
    const minutes = this.#store.selectSnapshot(MinutesState);
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
        working: new Working('summary')
      })
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
  // 🟩 TranscribeAudio (via Google speech-to-text)
  // //////////////////////////////////////////////////////////////////////////

  async transcribeAudio(): Promise<void> {
    const minutes = this.#store.selectSnapshot(MinutesState);
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
    this.#store.dispatch(
      new SetStatus({
        status: 'Transcribing audio',
        working: new Working('transcription')
      })
    );
    // 👇 initiate transcription
    const transcriber$ = await this.#transcriber.transcribe(request);
    transcriber$
      .pipe(
        catchError((error) => {
          this.#store.dispatch(new SetStatus({ error }));
          return of(null);
        }),
        tap((tx) => {
          if (tx)
            this.#store.dispatch([
              new SetComponentState({ transcriptionName: tx.name }),
              new SetStatus({
                status: `Transcribing audio: ${tx.progressPercent}% complete`
              })
            ]);
        }),
        filter((tx) => tx.progressPercent === 100)
      )
      .subscribe((tx) => {
        if (tx) {
          let nextTranscriptionID = minutes.nextTranscriptionID ?? 0;
          // 👇 make sure they're typed right and propery ID'd
          tx.transcription.forEach((t) => {
            t.id = ++nextTranscriptionID;
            t.type = 'TX';
          });
          this.#store.dispatch([
            new SetComponentState({ transcriptionName: null }),
            new SetMinutes({
              nextTranscriptionID,
              transcription: tx.transcription
            })
          ]);
          // 👇 finally
          this.#store.dispatch(new ClearStatus());
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
      if (minutes)
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
    return minutes;
  }

  #monitorAppQuit(): void {
    // 👇 save the minutes before quitting
    ipc.on(Channels.appBeforeQuit, async () => {
      const minutes = this.#store.selectSnapshot(MinutesState);
      const app = this.#store.selectSnapshot(AppState);
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
          const app = this.#store.selectSnapshot(AppState);
          return [minutes, app.pathToMinutes];
        }),
        filter(([minutes, path]) => !!(minutes && path)),
        debounceTime(Constants.saveFileInterval)
      )
      .subscribe(([minutes, path]) => {
        this.#fs.saveFile(path, JSON.stringify(minutes, null, 2));
      });
  }
}
