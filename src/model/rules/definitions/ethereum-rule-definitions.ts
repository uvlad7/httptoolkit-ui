/*
 * SPDX-FileCopyrightText: 2022 Tim Perry <tim@httptoolkit.tech>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import _ from 'lodash';
import {
    matchers,
    completionCheckers,
    RequestRuleData
} from 'mockttp';
import {
    HttpHandlerLookup
} from './http-rule-definitions';
import { encodeAbi } from './ethereum-abi';

export const EthereumMethods = {
    'eth_call': 'Call a contract method (without a transaction)',
    'eth_sendRawTransaction': 'Submit a signed transaction',
    'eth_sendTransaction': 'Submit an unsigned transaction',
    'eth_getTransactionReceipt': 'Return the receipt of a submitted transaction',
    'eth_getBalance': 'Return the balance of an account',
    'eth_gasPrice': 'Return the current gas price',
    'eth_blockNumber': 'Return the latest block number',
    'eth_getBlockByNumber': 'Return information about a block by number',
    'eth_getBlockByHash': 'Return information about a block by hash'
};

export type EthereumMethod = keyof typeof EthereumMethods;

export class EthereumMethodMatcher extends matchers.JsonBodyFlexibleMatcher {

    readonly uiType = 'eth-method';

    constructor(
        public readonly methodName: EthereumMethod = 'eth_call'
    ) {
        super({
            jsonrpc: '2.0',
            method: methodName
        });
    }

    explain() {
        return `Ethereum ${this.methodName} requests`;
    }

}

export class EthereumParamsMatcher extends matchers.JsonBodyFlexibleMatcher {

    readonly uiType = 'eth-params';

    constructor(
        public readonly params: any[]
    ) {
        super({ params });
    }

    explain() {
        return `matching ${JSON.stringify(this.params)}`;
    }

}

export class EthereumCallResultHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-call-result';

    constructor(
        public readonly outputTypes: string[],
        public readonly values: unknown[]
    ) {
        super({
            result: encodeAbi(outputTypes, values)
        });
    }

    explain() {
        if (!this.values.length) {
            return `Return an empty eth_call result`;
        } else {
            return `Return an eth_call result of ${this.values.join(', ')}`;
        }
    }

}

export class EthereumNumberResultHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-number-result';

    constructor(
        public readonly value: number
    ) {
        super({
            result: `0x${value.toString(16)}`
        });
    }

    explain() {
        return `Return ${this.value}`;
    }

}

export class EthereumHashResultHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-hash-result';

    constructor(
        public readonly value: string
    ) {
        super({
            result: value
        });
    }

    explain() {
        return `Return transaction hash ${this.value}`;
    }

}

export class EthereumReceiptResultHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-receipt-result';

    constructor(
        public readonly receiptValue: object = {
            // Default value, used to initialize a helpful placeholder
            status: '0x1',
            transactionHash: '012345',
            blockNumber: '0x100',
            blockHash: '0x1',
            from: '0x0',
            to: '0x0',
            cumulativeGasUsed: '0x1',
            gasUsed: '0x1',
            effectiveGasPrice: '0x0',
            contractAddress: null,
            logs: [],
            logsBloom: '0x0',
            type: '0x0'
        }
    ) {
        super({
            result: receiptValue
        });
    }

    explain() {
        return `Return a fixed transaction receipt`;
    }

}

export class EthereumBlockResultHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-block-result';

    constructor(
        public readonly blockValue: object = {
            // Default value, used to initialize a helpful placeholder
            "difficulty": "0x1",
            "extraData": "0x0",
            "gasLimit": "0x1",
            "gasUsed": "0x1",
            "hash": "0x1234",
            "logsBloom": "0x0",
            "miner": "0x1",
            "mixHash": "0x0",
            "nonce": "0x0",
            "number": "0x0",
            "parentHash": "0x1",
            "receiptsRoot": "0x1",
            "sha3Uncles": "0x1",
            "size": "0x1",
            "stateRoot": "0x1",
            "timestamp": "0x1",
            "totalDifficulty": "0x1",
            "transactions": [
                "0x1234"
            ],
            "transactionsRoot": "0x1",
            "uncles": []
        }
    ) {
        super({
            result: blockValue
        });
    }

    explain() {
        return `Return fixed block data`;
    }

}

export class EthereumErrorHandler extends HttpHandlerLookup['json-rpc-response'] {

    readonly uiType = 'eth-error';

    constructor(
        public readonly message: string,
        public readonly data = '0x',
        public readonly code = -32099,
        public readonly name: string | undefined = undefined
    ) {
        super({
            error: {
                message,
                data,
                code,
                name
            }
        });
    }

    explain() {
        return `Fail with ${this.message
            ? `"${this.message}"`
            : `code ${this.code}`
        }`;
    }

}

export const EthereumMatcherLookup = {
    'eth-method': EthereumMethodMatcher, // N.b. this is JSON-RPC method, not HTTP method
    'eth-params': EthereumParamsMatcher,

    // The subset of relevant HTTP matchers:
    'protocol': matchers.ProtocolMatcher,
    'host': matchers.HostMatcher,
    'hostname': matchers.HostnameMatcher,
    'port': matchers.PortMatcher,
    'simple-path': matchers.SimplePathMatcher,
    'regex-path': matchers.RegexPathMatcher,
    'header': matchers.HeaderMatcher,
    'query': matchers.QueryMatcher,
    'exact-query-string': matchers.ExactQueryMatcher,
    'cookie': matchers.CookieMatcher
};

export const EthereumInitialMatcherClasses = [
    EthereumMethodMatcher
];

export const EthereumHandlerLookup = {
    'eth-call-result': EthereumCallResultHandler,
    'eth-number-result': EthereumNumberResultHandler,
    'eth-hash-result': EthereumHashResultHandler,
    'eth-receipt-result': EthereumReceiptResultHandler,
    'eth-block-result': EthereumBlockResultHandler,
    'eth-error': EthereumErrorHandler,

    'passthrough': HttpHandlerLookup['passthrough'],
    'forward-to-host': HttpHandlerLookup['forward-to-host'],
    'timeout': HttpHandlerLookup['timeout'],
    'close-connection': HttpHandlerLookup['close-connection'],
    'request-breakpoint': HttpHandlerLookup['request-breakpoint'],
    'response-breakpoint': HttpHandlerLookup['response-breakpoint'],
    'request-and-response-breakpoint': HttpHandlerLookup['request-and-response-breakpoint']
};

type EthereumMatcherClass = typeof EthereumMatcherLookup[keyof typeof EthereumMatcherLookup];
export type EthereumMatcher = InstanceType<EthereumMatcherClass>;
export type EthereumInitialMatcher = InstanceType<typeof EthereumInitialMatcherClasses[number]>;

type EthereumHandlerClass = typeof EthereumHandlerLookup[keyof typeof EthereumHandlerLookup];
type EthereumHandler = InstanceType<EthereumHandlerClass>;

export interface EthereumMockRule extends Omit<RequestRuleData, 'matchers'> {
    id: string;
    type: 'ethereum';
    activated: boolean;
    matchers: Array<EthereumMatcher> & { 0?: EthereumMethodMatcher };
    handler: EthereumHandler;
    completionChecker: completionCheckers.Always; // HTK rules all *always* match
}