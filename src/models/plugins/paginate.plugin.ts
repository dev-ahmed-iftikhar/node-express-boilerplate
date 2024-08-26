import { Document, Model, Query } from 'mongoose';

/**
 * @typedef {Object} QueryResult
 * @property {Document[]} results - Results found
 * @property {number} page - Current page
 * @property {number} limit - Maximum number of results per page
 * @property {number} totalPages - Total number of pages
 * @property {number} totalResults - Total number of documents
 */
interface QueryResult {
  results: Document[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

interface PaginateOptions {
  sortBy?: string;
  populate?: string;
  limit?: number;
  page?: number;
}

// Define the static method signature
interface PaginateModel<T extends Document> extends Model<T> {
  statics: { paginate(filter: object, options: PaginateOptions): Promise<QueryResult> };
}

const paginate = <T extends Document>(schema: PaginateModel<T>) => {
  /**
   * Query for documents with pagination
   * @param {object} [filter] - Mongo filter
   * @param {PaginateOptions} [options] - Query options
   * @returns {Promise<QueryResult>}
   */
  schema.statics.paginate = async function (filter: object = {}, options: PaginateOptions = {}): Promise<QueryResult> {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria: string[] = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const page = options.page && options.page > 0 ? options.page : 1;
    const skip = (page - 1) * limit;

    const countPromise = schema.countDocuments(filter).exec();
    let query: Query<Document[], Document> = schema.find(filter).sort(sort).skip(skip).limit(limit);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption) => {
        const populatePath = populateOption
          .split('.')
          .reverse()
          .reduce((acc, path) => ({ path, populate: acc }), {} as any);
        query = query.populate(populatePath);
      });
    }

    const [totalResults, results] = await Promise.all([countPromise, query.exec()]);
    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      page,
      limit,
      totalPages,
      totalResults,
    };
  };
};

export default paginate;
