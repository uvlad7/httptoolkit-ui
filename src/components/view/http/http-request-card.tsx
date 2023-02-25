import * as React from 'react';
import { inject, observer } from 'mobx-react';
import * as dateFns from 'date-fns';

import { HttpExchange, HtkRequest } from '../../../types';
import { styled } from '../../../styles';
import { Icon } from '../../../icons';

import { aOrAn, uppercaseFirst } from '../../../util/text';

import { UiStore } from '../../../model/ui-store';
import { getSummaryColour } from '../../../model/events/categorization';
import { getMethodDocs } from '../../../model/http/http-docs';
import { nameHandlerClass } from '../../../model/rules/rule-descriptions';
import { HandlerClassKey } from '../../../model/rules/rules';

import {
    CollapsibleCardHeading,
    CollapsibleCard,
    CollapsibleCardProps
} from '../../common/card';
import { Pill, PillButton } from '../../common/pill';
import {
    CollapsibleSection,
    CollapsibleSectionSummary,
    CollapsibleSectionBody
} from '../../common/collapsible-section';
import {
    ContentLabel,
    ContentLabelBlock,
    ContentMonoValueInline,
    Markdown
} from '../../common/text-content';
import { DocsLink } from '../../common/docs-link';
import { SourceIcon } from '../../common/source-icon';
import { HeaderDetails } from './header-details';
import { UrlBreakdown } from '../url-breakdown';
import { TimingEvents } from 'mockrtc';

const MatchedRulePill = styled(inject('uiStore')((p: {
    className?: string,
    uiStore?: UiStore,
    ruleData: {
        stepTypes: HandlerClassKey[],
        status: 'unchanged' | 'modified-types' | 'deleted'
    },
    onClick: () => void
}) => {
    const { stepTypes } = p.ruleData;
    const stepDescription = stepTypes.length !== 1
        ? 'multi-step'
        : nameHandlerClass(stepTypes[0]);

    return <PillButton
        color={getSummaryColour('mutative')} // Conceptually similar - we've modified traffic
        className={p.className}

        // For now we show modified as unchanged, but we could highlight this later:
        disabled={p.ruleData.status === 'deleted'}
        onClick={p.ruleData.status !== 'deleted' ? p.onClick : undefined}

        title={
            `This request was handled by ${
                aOrAn(stepDescription)
             } ${stepDescription} rule${
                p.ruleData.status === 'deleted'
                    ? ' which has since been deleted'
                : p.ruleData.status === 'modified-types'
                    ? ' (which has since been modified)'
                : ''
            }.${
                p.ruleData.status !== 'deleted'
                    ? '\nClick here to jump to the rule on the Mock page.'
                    : ''
            }`
        }
    >
        <Icon icon={['fas', 'theater-masks']} />
        { uppercaseFirst(stepDescription) }
    </PillButton>;
}))`
    margin-right: auto;

    text-decoration: none;
    word-spacing: 0;

    > svg {
        margin-right: 5px;
    }
`;

const RawRequestDetails = (p: { request: HtkRequest, timingEvents: {} | TimingEvents }) => {
    const methodDocs = getMethodDocs(p.request.method);
    const methodDetails = [
        methodDocs && <Markdown
            key='method-docs'
            content={methodDocs.summary}
        />,
        methodDocs && <p key='method-link'>
            <DocsLink href={methodDocs.url}>Find out more</DocsLink>
        </p>
    ].filter(d => !!d);
    const startTime = 'startTime' in p.timingEvents
    ? p.timingEvents.startTime
    : undefined;

    return <div>
        {/* <ContentLabel>Time:</ContentLabel> { startTime ? dateFns.format(startTime, 'YYYY-MM-DD HH:mm:ss.SSS Z') : 'Unknown' } */}
        <CollapsibleSection>
            <CollapsibleSectionSummary>
                <ContentLabel>Time:</ContentLabel> { startTime ? dateFns.format(startTime, 'YYYY-MM-DD\u00A0\u00A0\u00A0HH:mm:ss\u2008.\u2008SSS') : 'Unknown' }
            </CollapsibleSectionSummary>

            {
               startTime ?
                    <CollapsibleSectionBody>
                        <p key='method-time'>{ dateFns.format(startTime) }</p>
                    </CollapsibleSectionBody>
                : null
            }
        </CollapsibleSection>
        
        <CollapsibleSection>
            <CollapsibleSectionSummary>
                <ContentLabel>Method:</ContentLabel> { p.request.method }
            </CollapsibleSectionSummary>

            {
                methodDetails.length ?
                    <CollapsibleSectionBody>
                        { methodDetails }
                    </CollapsibleSectionBody>
                : null
            }
        </CollapsibleSection>

        <ContentLabelBlock>URL</ContentLabelBlock>

        <CollapsibleSection prefixTrigger={true}>
            <CollapsibleSectionSummary>
                <ContentMonoValueInline>{
                    p.request.parsedUrl.parseable
                        ? p.request.parsedUrl.toString()
                        : p.request.url
                }</ContentMonoValueInline>
            </CollapsibleSectionSummary>

            {
                <CollapsibleSectionBody>
                    <UrlBreakdown url={p.request.parsedUrl} />
                </CollapsibleSectionBody>
            }
        </CollapsibleSection>

        <ContentLabelBlock>Headers</ContentLabelBlock>
        <HeaderDetails headers={p.request.headers} requestUrl={p.request.parsedUrl} />
    </div>;
}

interface HttpRequestCardProps extends CollapsibleCardProps {
    exchange: HttpExchange;
    matchedRuleData: {
        stepTypes: HandlerClassKey[],
        status: 'unchanged' | 'modified-types' | 'deleted'
    } | undefined;
    onRuleClicked: () => void;
}

export const HttpRequestCard = observer((props: HttpRequestCardProps) => {
    const { exchange, matchedRuleData, onRuleClicked } = props;
    const { request } = exchange;
    const { timingEvents } = exchange;

    // We consider passthrough as a no-op, and so don't show anything in that case.
    const noopRule = matchedRuleData?.stepTypes.every(
        type => type === 'passthrough' || type === 'ws-passthrough'
    )

    return <CollapsibleCard {...props} direction='right'>
        <header>
            { matchedRuleData && !noopRule &&
                <MatchedRulePill
                    ruleData={matchedRuleData}
                    onClick={onRuleClicked}
                />
            }
            <SourceIcon source={request.source} />
            <Pill color={getSummaryColour(exchange)}>
                { exchange.isWebSocket() ? 'WebSocket ' : '' }
                { request.method } {
                    (request.hostname || '')
                    // Add some tiny spaces to split up parts of the hostname
                    .replace(/\./g, '\u2008.\u2008')
                }
            </Pill>
            <CollapsibleCardHeading onCollapseToggled={props.onCollapseToggled}>
                Request
            </CollapsibleCardHeading>
        </header>
        <RawRequestDetails request={request} timingEvents={timingEvents} />
    </CollapsibleCard>;
});