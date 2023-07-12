import 'jest-extended';

import { Constants } from '#mm/common';
import { InsertAgendaItem } from '#mm/state/minutes';
import { InsertTranscription } from '#mm/state/minutes';
import { JoinTranscriptions } from '#mm/state/minutes';
import { MinutesState } from '#mm/state/minutes';
import { NgxsModule } from '@ngxs/store';
import { RemoveAgendaItem } from '#mm/state/minutes';
import { RemoveTranscription } from '#mm/state/minutes';
import { SetMinutes } from '#mm/state/minutes';
import { SplitTranscription } from '#mm/state/minutes';
import { Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';
import { UpdateAgendaItem } from '#mm/state/minutes';
import { UpdateSummary } from '#mm/state/minutes';
import { UpdateTranscription } from '#mm/state/minutes';

let minutesState: MinutesState;
let store: Store;

const agendaItem = {
  title: 'xxx',
  type: 'AG'
};

const summary = {
  section: 'xxx',
  summary: 'yyy'
};
const transcription = {
  speaker: '1',
  speech: 'hello, world!',
  start: 0,
  type: 'TX'
};
const defaultState = {
  audio: {
    encoding: 'MP3',
    gcsuri: 'gs://yyy',
    sampleRateHertz: 1000,
    url: 'http://zzz'
  },
  summary: [summary],
  title: 'xxx',
  transcription: [transcription]
};

describe('MinutesState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([MinutesState])]
    });
    minutesState = TestBed.inject(MinutesState);
    store = TestBed.inject(Store);
    // 👇 set the store to its default state
    store.reset({ ...store.snapshot(), minutes: defaultState });
  });

  it('can select the summary', () => {
    const summ = store.selectSnapshot(MinutesState.summary);
    expect(summ).toStrictEqual([summary]);
  });

  it('can select the transcription', () => {
    const tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([transcription]);
  });

  it('responds to Insert/RemoveAgendaItem', () => {
    store.dispatch(new InsertAgendaItem(agendaItem as any, 0));
    let tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([
      expect.objectContaining(agendaItem),
      transcription
    ]);
    store.dispatch(new RemoveAgendaItem(0));
    tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([transcription]);
  });

  it('responds to Insert/RemoveTranscription', () => {
    store.dispatch(new InsertTranscription(transcription as any, 1));
    let tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([
      transcription,
      expect.objectContaining(transcription)
    ]);
    store.dispatch(new RemoveTranscription(1));
    tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([transcription]);
  });

  it('responds to Split/JoinTranscriptions', () => {
    store.dispatch(new SplitTranscription(0, 7));
    let tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([
      expect.objectContaining({ speech: 'hello,' }),
      expect.objectContaining({ speech: 'world!' })
    ]);
    store.dispatch(new JoinTranscriptions(0));
    tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([transcription]);
  });

  it('responds to UpdateAgendaItem', () => {
    store.dispatch(new InsertAgendaItem(agendaItem as any, 0));
    store.dispatch(new UpdateAgendaItem({ title: 'zzz' }, 0));
    const tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([
      expect.objectContaining({ title: 'zzz' }),
      transcription
    ]);
  });

  it('responds to UpdateSummary', () => {
    store.dispatch(new UpdateSummary({ summary: 'zzz' }, 0));
    const summ = store.selectSnapshot(MinutesState.summary);
    expect(summ).toStrictEqual([expect.objectContaining({ summary: 'zzz' })]);
  });

  it('responds to UpdateTranscription', () => {
    store.dispatch(new UpdateTranscription({ speaker: '2' }, 0));
    const tx = store.selectSnapshot(MinutesState.transcription);
    expect(tx).toStrictEqual([
      expect.objectContaining({ speaker: '2', start: 0 })
    ]);
  });

  it('responds to SetMinutes', () => {
    store.dispatch(new SetMinutes({ title: 'zzz' }));
    const minutes = store.selectSnapshot(MinutesState);
    expect(minutes).toStrictEqual({ ...defaultState, title: 'zzz' });
  });

  it('updateBuffer$ works ... eventually', (done) => {
    minutesState.updateBuffer$.next(
      new UpdateTranscription({ speaker: '2' }, 0)
    );
    setTimeout(() => {
      const tx = store.selectSnapshot(MinutesState.transcription);
      expect(tx).toStrictEqual([
        expect.objectContaining({ speaker: '2', start: 0 })
      ]);
    }, Constants.updateBufferDebounceTime * 2);
    done();
  });
});
