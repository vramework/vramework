/**
 * Simplest class to represent a vramework request.
 * @template In - The type of the request body.
 * @group RequestResponse
 */
export abstract class VrameworkRequest<In = any> {
    constructor(private data?: In) {

    }

    /**
     * Retrieves the data
     * @returns A promise that resolves to an object containing the combined data.
     */
    public async getData(): Promise<In> {
        if (!this.data) {
            throw new Error('Data not found')
        }
        return this.data
    }
}
