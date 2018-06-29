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
  - [Error handling](#error-handling)
  - [Making generic actions](#)
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

# Getting started
Your component needs to be decorated by `withPromise` HOC in order to be able fetch the data and have an access to it.

Once you call `this.props.movies.fetch()`, your Promise function will be envoked and updated state variables will be passed into the component.

When request is in progress and not finished yet - `isFetching` variable will be equal to `true`.
After request will be fetched, you'll get the response in `data` variable and timestamp of the request as `lastUpdated` value.

> ⚠️ Note, that it's not safe to rely only on `isFetching` variable when displaying loading indicators. On the first render, you will have `isFetching:false`, because data fetching starts **after** your component mounts. Additionally, you should check that `lastUpdated` variable is falsy, which is guaranteed when you render your component first time.
```javascript
  import { withPromise } from 'react-promisify';

  class Movies extends React.Component {
    componentDidMount() {
      this.props.movies.fetch()
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

  const DecoratedMovies = withPromise("movies", fetchMovies)(Movies)
```