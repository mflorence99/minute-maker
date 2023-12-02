import { Action } from '@ngxs/store';
import { Constants } from '#mm/common';
import { Injectable } from '@angular/core';
import { Minutes } from '#mm/common';
import { State } from '@ngxs/store';
import { TabIndex } from '#mm/state/component';
import { Transcription } from '#mm/common';

export class AnalyzeMinutes {
  static readonly type = '[Issues] AnalyzeMinutes';
  constructor(public minutes: Minutes) {}
}

export type Issue = {
  message?: string;
  severity: 'error' | 'warning';
  tabIndex: TabIndex;
  tx?: Transcription;
};

export type IssuesStateModel = Issue[];

export function defaultIssues(): IssuesStateModel {
  return [];
}

type Rule = Pick<Issue, 'message' | 'severity' | 'tabIndex'> & {
  checker: (minutes: Minutes, rule: Rule) => Issue[] | Issue | null;
};

const rules: Rule[] = [
  {
    checker: (minutes, rule) => (minutes.organization ? null : rule),
    message: 'Organization not specified',
    severity: 'error',
    tabIndex: TabIndex.details
  },
  {
    checker: (minutes, rule) => (minutes.subject ? null : rule),
    message: 'Subject not specified',
    severity: 'warning',
    tabIndex: TabIndex.details
  },
  {
    checker: (minutes, rule) => (minutes.date ? null : rule),
    message: 'Date and time not specified or is invalid',
    severity: 'error',
    tabIndex: TabIndex.details
  },
  {
    checker: (minutes, rule) => (minutes.present.length ? null : rule),
    message: `No members marked 'present'`,
    severity: 'warning',
    tabIndex: TabIndex.details
  },
  {
    checker: (minutes, rule) => (minutes.badges.length ? null : rule),
    message: `No badge created`,
    severity: 'warning',
    tabIndex: TabIndex.badges
  },
  {
    checker: (minutes, rule): Issue[] => {
      const speakers = new Set<string>();
      const speakerx = new RegExp(`^${Constants.speakerPfx}.*$`);
      return minutes.transcription.reduce((issues, tx) => {
        if (
          tx.type === 'TX' &&
          speakerx.test(tx.speaker) &&
          !speakers.has(tx.speaker)
        ) {
          speakers.add(tx.speaker);
          issues.push({
            ...rule,
            message: `${tx.speaker} not identified`,
            tx
          });
        }
        return issues;
      }, []);
    },
    severity: 'error',
    tabIndex: TabIndex.transcription
  },
  {
    checker: (minutes, rule) => (minutes.transcription.length ? null : rule),
    message: `Audio not transcribed`,
    severity: 'error',
    tabIndex: TabIndex.transcription
  },
  {
    checker: (minutes, rule) => (minutes.summary.length ? null : rule),
    message: `No summary created`,
    severity: 'warning',
    tabIndex: TabIndex.summary
  }
];

@State<IssuesStateModel>({
  name: 'issues',
  defaults: defaultIssues()
})
@Injectable()
export class IssuesState {
  //

  // //////////////////////////////////////////////////////////////////////////
  // 🟩 AnalyzeMinutes
  // //////////////////////////////////////////////////////////////////////////

  @Action(AnalyzeMinutes) analyzeMinutes(
    { setState },
    { minutes }: AnalyzeMinutes
  ): void {
    setState(
      rules.reduce((issues, rule) => {
        const issue = rule.checker(minutes, rule);
        if (Array.isArray(issue)) issues.push(...issue);
        else if (issue) issues.push(issue);
        return issues;
      }, [])
    );
  }
}
