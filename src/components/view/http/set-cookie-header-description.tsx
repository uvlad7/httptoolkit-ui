import * as React from 'react';

import { parse as parseCookie, Cookie } from 'set-cookie-parser';
import {
    isFuture,
    addSeconds,
    format as formatDate,
    distanceInWordsToNow
} from 'date-fns';

import { Content } from '../../common/text-content';

function getExpiryExplanation(date: Date) {
    const exactTime = formatDate(date, 'YYYY-MM-DD [at] HH:mm:ss');
    const relativeTime = distanceInWordsToNow(date);

    if (isFuture(date)) {
        return <>
            will expire <span title={exactTime}>in {relativeTime}</span>
        </>
    } else {
        return <>
            expired <span title={exactTime}>{relativeTime} ago</span>
        </>
    }
}

export const CookieHeaderDescription = (p: { value: string, requestUrl: URL }) => {
    const cookies = parseCookie(p.value);

    // The effective path at which cookies will be set by default.
    const requestPath = p.requestUrl.pathname.replace(/\/[^\/]*$/, '') || '/';

    return <>{
        // In 99% of cases there is only one cookie here, but we can play it safe.
        cookies.map((
            cookie: Cookie & { sameSite?: 'Strict' | 'Lax' }
        ) => <Content key={cookie.name}>
            <p>
                Set cookie '<code>{cookie.name}</code>' to '<code>{cookie.value}</code>'
            </p>

            <p>
                This cookie will be sent in future
                { cookie.secure ? ' secure ' : ' secure and insecure ' }
                requests to{' '}
                { cookie.domain ? <>
                    {cookie.domain.replace(/^\./, '')} and subdomains
                </> : <>
                    {p.requestUrl.hostname}, but not its subdomains
                </> }

                { cookie.path === '/' || requestPath === '/' ? <>
                    .
                </> : cookie.path !== undefined ? <>
                    , for paths within '{cookie.path}'.
                </> : <>
                    , for paths within '{requestPath}'.
                </> }
            </p>
            <p>
                The cookie is {
                    cookie.httpOnly ?
                        'not accessible from client-side scripts' :
                        'accessible from client-side scripts running on matching pages'
                }
                { cookie.sameSite === undefined ? <>
                    . Matching requests triggered from other origins will {
                        cookie.httpOnly ? 'however' : 'also'
                    } include this cookie.
                </> : cookie.sameSite.toLowerCase() === 'strict' ? <>
                    , { cookie.httpOnly ? 'and' : 'but' } matching requests triggered
                    from other origins will not include this cookie.
                </> : <>{ /* sameSite === 'lax' */ }
                    . Matching requests triggered from other origins will include this
                    cookie, but only if they are top-level navigations using safe HTTP methods.
                </> }
            </p>

            <p>
                The cookie {
                    cookie.maxAge ? <>
                        { getExpiryExplanation(addSeconds(new Date(), cookie.maxAge)) }
                        { cookie.expires && ` ('max-age' overrides 'expires')` }
                    </> :
                    cookie.expires ?
                        getExpiryExplanation(cookie.expires)
                    : 'expires at the end of the current session'
                }.
            </p>
        </Content>)
    }</>
};