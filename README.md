# react-promisify
> React data fetching made simple.

This project is a simple Higher Order Component wrapper around Promises in React. It allows you to define your API calls, initiate data fetching and consume results in elegant and clean way. State managing is done for you under the hood.

## Table of Contents
- [Demo](#demo)
- [Installation](#installation)
- [Getting started](#getting-started)
- [Advanced usage](#advanced-usage)
  - [Using middlewares](#using-middlewares)
  - [Updating response data](#updating-response-data)
  - [Transforming server response](#transforming-server-response)
  - [Error handling](#error-handling)
  - [Canceling requests](#canceling-requests)
  - [Lazy loading](#lazy-loading)
  - [Caching](#caching)
  - [Combining with Context api](#combining-with-context-api)
- [API reference](#api-reference)
- [Examples](#examples)
  - [Real world](#real-world)

## Demo
The simplest way to start playing around with `react-promisify` is with this CodeSandbox snippet:
<br/>
https://codesandbox.io/

It covers basic Promise request definition and data fetching emitting.

## Installation
Install it with `yarn`:
```
yarn add react-promisify
```
Or with `npm`:
```
npm install react-promisify --save
```

## Getting started
Your component needs to be decorated by `withPromise` HOC in order to be able fetch the data and have an access to it. It accepts the name of the prop, containing response state as the first argument and a function, which returns Promise as a second.

Once you call `this.props.movies.fetch()`, your Promise function will be envoked and updated state variables will be passed into the component. Parameters, passed to `fetch()` method, will be automatically provided to your custom Promise function.

When request is in progress and not finished yet - `isFetching` variable will be equal to `true`.
After request will be fetched, you'll get the response in `data` variable and timestamp of the request as `lastUpdated` value.

> ⚠️ Note, that it's not safe to rely only on `isFetching` variable when displaying loading indicators. On the first render, you will have `isFetching:false`, because data fetching starts **after** your component mounts. Additionally, you should check that `lastUpdated` variable is falsy, which is guaranteed when you render your component first time.
```javascript
  import { withPromise } from 'react-promisify';

  class Movies extends React.Component {
    componentDidMount() {
      this.props.movies.fetch("comedy")
    }

    render() {
      const { isFetching, lastUpdated, data } = this.props.movies;

      return isFetching || !lastUpdated ? (
        <div>Loading...</div>
      ) : (
        <div>
          {data.map(movie => <div key={movie.id}>{movie.title}</div>)}
        </div>
      );
    }
  }

  const fetchMovies = (category) =>
    fetch(`http://your-amazing-api.com/movies/${category}`)
      .then(res => res.json())

  const DecoratedMovies = withPromise("movies", fetchMovies)(Movies);
```

## Advanced usage
### Using middlewares
Middlewares are useful when you need to hook up into the request/response lifecycle, make some actions before or after the response finished.

Basic middleware function is having the following signature:
```javascript
(next) => (...args) => {}
```
It accepts `next` Promise function in the middleware chain as an input and returns new Promise function, which will be passed to the next middleware. Returned function, will take the same arguments as your initial data fetching call.

The simple logger middleware will look as the following:
```javascript
const logger = (next) => (...args) => {
  console.log("Request was started with these arguments:", args);
  return next(...args).then(res => {
    console.log("Request was finished with:", res);
    return err;
  }).catch(err => {
    console.log("Request was failed with:", err);
    throw err;
  });
}
```

It could be applied by returning it from the function, passed at the 3rd argument of the HOC:
```javascript
withPromise("movies", fetchMovies, props => logger);
```

Out of the box, the library is coming with `onSuccess`, `onFailure` and `provideRequest` middlewares.
> Refer to the [API reference](#api-reference) for detailed information regarding each one.
```javascript
import { compose } from 'ramda';

export default withPromise("movies", fetchMovies, props => compose(
  provideRequest(() => [props.userId]),
  onSuccess(() => {
    console.log("Request was succeded");
  }),
  onFailure(() => {
    console.log("Request was failed");
  })
))(Movies);
```
In the example above, `compose` function from [Ramda](https://ramdajs.com/docs/#compose) is used for combining multiple middlewares into a single one.

### Updating response data
Most likely, in a complex cases you will need to update fetched data state in response to some actions in future. For example, when new movie is created, you will want to update its list.
For that case, `.update()` method of the provided request prop should be used:
```javascript
import { compose } from 'ramda';

export default compose(
  withPromise("fetchMovies", fetchMovies),
  withPromise("createMovie", createMovie, props => onSuccess(movie => {
    props.update(movies => [...movies, movie]);
  }))
)(Movies);
```
`compose` function, from that example serves the same purpose - composing multiple HOC's into a new one.

### Error handling

### Roadmap
- Default value support