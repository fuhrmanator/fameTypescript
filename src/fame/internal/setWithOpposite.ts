/** Wrap a Set to support multiple values, e.g., incomingAccesses are a set, but each entry has an "opposite" */
export abstract class SetWithOpposite<T> implements Set<T> {

    abstract setOpposite(value: T) : this
    abstract clearOpposite(value: T) : this

    add(value: T): this {
        if (!this._values.has(value)) {
            this._values.add(value)
            this.setOpposite(value)
        }
        return this
    }

    constructor(iterable?: T[]) {
		this.clear();

		if (iterable === undefined) {
			return;
		}

		if (!Array.isArray(iterable)) {
			throw new Error("Non-array iterables are not supported by the SetWithOpposite constructor.");
		}

		for (const value of iterable) {
			this.add(value);
		}
	}

    clear(): void {
        this._values.clear()
    }

    delete(value: T): boolean {
        if (this._values.has(value)) this.clearOpposite(value)
        return this._values.delete(value)
    }

    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
		for (const element of this._values.keys()) {
			callbackfn.call(thisArg, element, element, this);
		}
    }

    has(value: T): boolean {
        return this._values.has(value)
    }

	get size(): number {
		return this._values.size;
	}

    entries(): IterableIterator<[T, T]> {
        return this._values.entries()
    }

    keys(): IterableIterator<T> {
        return this._values.keys()
    }

    values(): IterableIterator<T> {
        return this._values.values()
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.values()
    }

    [Symbol.toStringTag]: string;

    _values = new Set<T>()

}