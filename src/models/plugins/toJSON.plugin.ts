import { Schema, Document } from 'mongoose';

/**
 * A Mongoose schema plugin that applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */
const deleteAtPath = (obj: any, path: string[], index: number): void => {
  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }
  deleteAtPath(obj[path[index]], path, index + 1);
};

// Define an interface for the custom toJSON options
interface CustomSchemaOptions {
  toJSON?: {
    transform?: (doc: Document, ret: any, options: any) => any;
  };
}

// Extend Schema to include CustomSchemaOptions
interface CustomSchema extends Schema {
  options: CustomSchemaOptions;
}

const toJSON = (schema: CustomSchema): void => {
  let transform: ((doc: Document, ret: any, options: any) => any) | undefined;

  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  schema.options.toJSON = {
    ...schema.options.toJSON,
    transform(doc: Document, ret: any, options: any): any {
      Object.keys(schema.paths).forEach((path) => {
        const pathOptions = (schema.paths[path] as any).options;
        if (pathOptions && pathOptions.private) {
          deleteAtPath(ret, path.split('.'), 0);
        }
      });

      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;

      if (transform) {
        return transform(doc, ret, options);
      }

      return ret;
    },
  };
};

export default toJSON;
