import * as _ from 'lodash';
import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { styled } from '../../../styles';
import { Headers } from '../../../types';

import { getHeaderDocs } from '../../../model/http/http-docs';
import { AccountStore } from '../../../model/account/account-store';

import { CollapsibleSection } from '../../common/collapsible-section';
import { DocsLink } from '../../common/docs-link';
import { BlankContentPlaceholder } from '../../common/text-content';
import {
    CollapsibleSectionSummary,
    CollapsibleSectionBody
} from '../../common/collapsible-section';

import { CookieHeaderDescription } from './set-cookie-header-description';
import { UserAgentHeaderDescription } from './user-agent-header-description';

const HeadersGrid = styled.section`
    display: grid;
    grid-template-columns: 20px fit-content(30%) 1fr;

    grid-gap: 5px 0;
    &:not(:last-child) {
        margin-bottom: 10px;
    }
`;

const HeaderKeyValue = styled(CollapsibleSectionSummary)`
    word-break: break-all; /* Fallback for anybody without break-word */
    word-break: break-word;
    font-family: ${p => p.theme.monoFontFamily};
    line-height: 1.1;
`;

const HeaderName = styled.span`
    margin-right: 10px;
`;

const HeaderDescriptionContainer = styled(CollapsibleSectionBody)`
    line-height: 1.3;
`;

const HeaderDocsLink = styled(DocsLink)`
    display: block;
    margin-top: 10px;
`;

const getHeaderDescription = (
    name: string,
    value: string,
    requestUrl: URL,
    isPaidUser: boolean
) => {
    if (isPaidUser) {
        if (name === 'set-cookie') {
            return <CookieHeaderDescription
                value={value}
                requestUrl={requestUrl}
            />;
        } else if (name === 'user-agent') {
            return <UserAgentHeaderDescription
                value={value}
            />;
        }
    }

    const headerDocs = getHeaderDocs(name)?.summary;

    return headerDocs && <p>
        { headerDocs }
    </p>
};

export const HeaderDetails = inject('accountStore')(observer((props: {
    headers: Headers,
    requestUrl: URL,
    accountStore?: AccountStore
}) => {
    const headerNames = Object.keys(props.headers).sort();

    return headerNames.length === 0 ?
        <BlankContentPlaceholder>(None)</BlankContentPlaceholder>
    :
        <HeadersGrid>
            { _.flatMap(headerNames, (name) => {
                const headerValue = props.headers[name]!;
                if (typeof headerValue === 'string') {
                    return {
                        name,
                        value: headerValue,
                        key: name
                    };
                } else {
                    return headerValue.map((value, i) => ({
                        name,
                        value,
                        key: name + i
                    }));
                }
            }).map(({ name, value, key }) => {
                const docs = getHeaderDocs(name);
                const description = getHeaderDescription(
                    name,
                    value,
                    props.requestUrl,
                    props.accountStore!.isPaidUser
                )

                return <CollapsibleSection withinGrid={true} key={key}>
                        <HeaderKeyValue>
                            <HeaderName>{ name }: </HeaderName>
                            <span>{ value }</span>
                        </HeaderKeyValue>

                        { description && <HeaderDescriptionContainer>
                            { description }
                            { docs && <HeaderDocsLink href={docs.url}>
                                Find out more
                            </HeaderDocsLink> }
                        </HeaderDescriptionContainer> }
                </CollapsibleSection>
            }) }
        </HeadersGrid>;
}));