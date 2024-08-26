/**
 * Create an object composed of the picked object properties
 * @param object - The source object
 * @param keys - An array of keys to pick from the object
 * @returns A new object composed of the picked properties
 */
function pick<T extends {}, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: Partial<T> = {};
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result as Pick<T, K>;
}
export default pick;
