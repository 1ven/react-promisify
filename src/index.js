import React from "react";

const identity = x => x;

export const fetch = () => {};

export const withPromise = (
  key,
  fn,
  propsToMiddleware = () => identity,
  propsToStructure = () => (input, fn, state) => fn(state)
) => Component => {
  class ReactPromisify extends React.Component {
    constructor(props) {
      super(props);

      this.state = {};

      this.cancellations = {};
      this.nextRequestIndex = 0;

      this.fetch = this.fetch.bind(this);
      this.update = this.update.bind(this);
      this.cancel = this.cancel.bind(this);
    }

    updateState(input, itemState) {
      this.setState(state =>
        propsToStructure(this.props)(
          input,
          item => ({
            ...item,
            ...itemState
          }),
          state
        )
      );
    }

    onRequest(input) {
      this.updateState(input, { isFetching: true });
    }

    onSuccess(input, result) {
      this.updateState(input, {
        isFetching: false,
        lastUpdated: Date.now(),
        data: result,
        error: void 0
      });
    }

    onFailure(input, err) {
      this.updateState(input, {
        isFetching: false,
        error: err
      });
    }

    update(fn, path = []) {
      this.setState(state => updateObject(fn, [...path, "data"], state));
    }

    cancel() {
      for (let index of Object.keys(this.cancellations)) {
        this.cancellations[index]();
      }
    }

    async fetch(...input) {
      const index = this.nextRequestIndex;
      this.nextRequestIndex = this.nextRequestIndex + 1;

      const callPromise = propsToMiddleware(this.props, this.state.data)(
        async (...args) => {
          const promise = fn(...args);

          if (promise.cancel) {
            this.cancellations[index] = promise.cancel;
          }

          return promise;
        }
      );

      this.onRequest(input);
      try {
        const result = await callPromise(...input);
        this.onSuccess(input, result);
        return result;
      } catch (err) {
        this.onFailure(input, err);
        throw err;
      } finally {
        delete this.cancellations[index];
      }
    }

    render() {
      return (
        <Component
          {...this.props}
          {...{
            [key]: {
              ...this.state,
              update: this.update,
              cancel: this.cancel,
              fetch: this.fetch
            }
          }}
        />
      );
    }
  }

  return ReactPromisify;
};

const updateObject = (updater, path, obj) => {
  let newObj = Object.assign({}, obj);
  let newObjRef = newObj;
  let stack = path.slice(0);

  while (stack.length > 1) {
    newObjRef = newObjRef[stack.shift()];
  }

  const key = stack.shift();

  newObjRef[key] = updater(newObjRef[key]);

  return newObj;
};
