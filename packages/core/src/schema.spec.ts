import { expect } from 'chai';
import { coerceQueryStringToArray, addSchema } from './schema.js';

describe('Schema', () => {
    describe('coerceStringToArray', () => {
        before(() => {
            // Add schemas dynamically using addSchema
            addSchema('testSchema', {
                properties: {
                    tags: { type: 'array' },
                    count: { type: 'number' },
                    name: { type: 'string' },
                },
            });

            addSchema('booleanSchema', {
                properties: {
                    isActive: true, // Invalid schema definition, but the function should handle it
                    tags: { type: 'array' },
                },
            });
        });

        it('should split a string into an array for properties of type array', () => {
            const data = { tags: 'a,b,c' };
            coerceQueryStringToArray('testSchema', data);
            expect(data.tags).to.deep.equal(['a', 'b', 'c']);
        });

        it('should not modify properties of type array if they are already arrays', () => {
            const data = { tags: ['a', 'b', 'c'] };
            coerceQueryStringToArray('testSchema', data);
            expect(data.tags).to.deep.equal(['a', 'b', 'c']);
        });

        it('should not modify properties that are not type array', () => {
            const data = { count: 5, name: 'example' };
            coerceQueryStringToArray('testSchema', data);
            expect(data.count).to.equal(5);
            expect(data.name).to.equal('example');
        });

        it('should handle cases where the data object does not have a key present in the schema', () => {
            const data = { unknownKey: 'shouldRemain' };
            coerceQueryStringToArray('testSchema', data);
            expect(data.unknownKey).to.equal('shouldRemain');
        });

        it('should handle cases where schema properties contain boolean values', () => {
            const data = { tags: 'a,b,c', isActive: 'true' };
            coerceQueryStringToArray('booleanSchema', data);
            expect(data.tags).to.deep.equal(['a', 'b', 'c']);
            expect(data.isActive).to.equal('true'); // No coercion should happen
        });
    });
});
