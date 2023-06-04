export interface TranscriptionContext {
  audio: {
    encoding: string;
    gcsuri: string;
    samplaeRateHertz: number;
  };
  date: string;
  speakers: string[];
  subject: string;
  subtitle: string;
  title: string;
}
