import { posthog } from 'posthog-js';
import { format as formatDate } from 'date-fns';

import { serverVersion, desktopVersion, UI_VERSION } from './services/service-versions';

const POSTHOG_KEY = process.env.POSTHOG_KEY;
const enabled = !!POSTHOG_KEY && navigator.doNotTrack !== "1";

// Note that all metrics here are fully anonymous.
// No user information is tracked, no events are
// sent including anything personally identifiable,
// and all Posthog data (soon: all data) is sent
// via an anonymizing proxy so no IP is exposed.

// Metrics are used only to monitor real world
// performance, work out which features of the app
// are used, and detect issues (e.g. % failure for
// different types of interception).

export function initMetrics() {
    if (enabled) {
        posthog.init(POSTHOG_KEY, {
            api_host: 'https://events.httptoolkit.tech',
            autocapture: false, // No automatic event capture please

            capture_pageview: false, // We manually capture pageview (to sanitize & dedupe URLs)

            advanced_disable_decide: true, // We don't need dynamic features, skip checking
            disable_session_recording: false, // Disabled server-side, but disable explicitly here too

            persistence: 'memory' // No cookies/local storage tracking - just anon session metrics
        });
    }
}

// Log the first run date for users, which gives us just enough data to count new vs existing installs, and overall
// retention (do people keep using the tool) and user stats, but at day resolution so it's not actually identifiable:
const today = formatDate(new Date(), 'YYYY-MM-DD');
const isFirstRun = localStorage.getItem('first-run-date') === null &&
    localStorage.getItem('theme-background-color') === null; // Extra check, for people who pre-date first-run-date

const storedFirstRunDate = localStorage.getItem('first-run-date');
const firstRunDate = storedFirstRunDate ?? today;
if (!storedFirstRunDate) {
    localStorage.setItem('first-run-date', firstRunDate);
}

// Track last run too, which gives us some idea of how many users use HTTP Toolkit per day.
const isFirstRunToday = localStorage.getItem('last-run-date') !== today;
if (isFirstRunToday) localStorage.setItem('last-run-date', today);

// (Of course, Posthog does have retention tools to track this kind of thing in depth, but we avoid using them here
// as they require tracking individual users & storing persistent ids etc - rough & anon is good enough).

// This is passed via $set_once on all Posthog events, and the session collects metadata once it's
// available. These values never change as all metrics are anonymous - there's no connection between
// sessions, so the desktop/server version is always fixed.
const sessionData = () => ({
    'first-run': isFirstRun,
    'first-run-today': isFirstRunToday,
    'ui-version': UI_VERSION,
    'server-version': serverVersion.state === 'fulfilled' ? serverVersion.value : undefined,
    'desktop-version': desktopVersion.state === 'fulfilled' ? desktopVersion.value : undefined,
});

const normalizeUrl = (url: string) =>
    url
    .replace(/\/view\/[a-z0-9\-]+/, '/view') // Strip row ids
    .replace(/\/mock\/[a-z0-9\-]+/, '/mock') // Strip mock rule ids
    .replace(/\?.*/, ''); // Strip any query & hash params

let lastUrl: string | undefined;
export function trackPage(location: Window['location']) {
    if (!enabled) return;

    const currentUrl = normalizeUrl(location.href);

    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    posthog.capture('$pageview', {
        $current_url: currentUrl,
        $set_once: { ...sessionData() }
    });
}

export function trackEvent(event: {
    category: string,
    action: string,
    value?: string
}) {
    if (!enabled) return;

    const currentUrl = normalizeUrl(location.href);

    posthog.capture(`${event.category}:${event.action}`, {
        value: event.value,
        $current_url: currentUrl,
        $set_once: { ...sessionData() }
    });
}