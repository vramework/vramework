export interface Logger {
    info(messageOrObj: string | Record<string, any>, ...meta: any[]): void;
    warn(messageOrObj: string | Record<string, any>, ...meta: any[]): void;
    error(messageOrObj: string | Record<string, any> | Error, ...meta: any[]): void;
    debug?(message: string, ...meta: any[]): void;
    log(level: string, message: string, ...meta: any[]): void;
}

export class ConsoleLogger implements Logger {
    info(messageOrObj: string | Record<string, any>, ...meta: any[]): void {
        console.log('INFO:', messageOrObj, ...meta);
    }
    warn(messageOrObj: string | Record<string, any>, ...meta: any[]): void {
        console.warn('WARN:', messageOrObj, ...meta);
    }
    error(messageOrObj: string | Record<string, any> | Error, ...meta: any[]): void {
        console.error('ERROR:', messageOrObj, ...meta);
    }
    debug?(message: string, ...meta: any[]): void {
        console.debug('DEBUG:', message, ...meta);
    }
    log(level: string, message: string, ...meta: any[]): void {
        console.log(level.toUpperCase() + ':', message, ...meta);
    }
}