import { HTTPResponseService } from '@vramework/core/types';
import { NextResponse } from 'next/server';

export class NextHTTPResponseService implements HTTPResponseService {
    constructor(protected response: NextResponse) {

    }

    public setCookie (name: string, value: string, options: any): void {
        // this.response.coo(name, value, options)
    }
}