/**
 * Translates the farmer's report-status notifications.
 *
 * The backend writes a notification's title and body as English
 * strings at the moment the CAO acts (see updateReportStatus in
 * backend/src/services/report.service.ts) and stores them as-is - at
 * that point it cannot know which language the farmer will be reading
 * in, and the farmer can switch language any time afterwards. So the
 * phone translates when it renders: it recognises the backend's
 * canned English text and swaps in the active language's version.
 *
 * Anything it does not recognise is shown untouched. That covers the
 * message the CAO types themselves (their own words, not ours to
 * translate) and any wording the backend changes later - the worst
 * case is English, never a blank or a crash.
 *
 * The English strings below must stay identical to the backend's. They
 * are read from the `en` dictionary rather than repeated here, so the
 * only copy to keep in sync with the backend is translations.ts.
 */

import { en, type NotificationStatusKey, type Translations } from '../i18n/translations';
import type { NotificationItem } from '../services/notification.service';

const STATUS_KEYS = Object.keys(en.notifications.reportStatus) as NotificationStatusKey[];

/** The backend may tack " Agriculturist: <name>." onto a status body. */
const AGRICULTURIST_SUFFIX = / Agriculturist: (.+)\.$/;

function findStatusByTitle(title: string): NotificationStatusKey | undefined {
  return STATUS_KEYS.find((key) => en.notifications.reportStatus[key].title === title);
}

function findStatusByBody(body: string): NotificationStatusKey | undefined {
  return STATUS_KEYS.find((key) => en.notifications.reportStatus[key].body === body);
}

export function localizeNotification(
  item: NotificationItem,
  t: Translations
): { title: string; body: string | null } {
  if (item.type !== 'report_status') {
    return { title: item.title, body: item.body };
  }

  const statusFromTitle = findStatusByTitle(item.title);
  const title = statusFromTitle ? t.notifications.reportStatus[statusFromTitle].title : item.title;

  if (!item.body) return { title, body: item.body };

  // Canned body, possibly followed by the assigned agriculturist's name.
  const suffix = item.body.match(AGRICULTURIST_SUFFIX);
  const base = suffix ? item.body.slice(0, suffix.index) : item.body;
  const statusFromBody = findStatusByBody(base);
  if (!statusFromBody) return { title, body: item.body }; // the CAO's own message

  const translated = t.notifications.reportStatus[statusFromBody].body;
  return {
    title,
    body: suffix ? `${translated} ${t.notifications.agriculturistLine(suffix[1])}` : translated,
  };
}
