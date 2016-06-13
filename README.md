# Hello Webpack

Basic boilerplate for mithril.js app using webpack.



## Development

```sh
npm i
npm start
```

## Build

```sh
npm i
npm run build
```

# App Architecture

1. [mithril.js][1]: view layer, and other goodies
2. [EventEmitter][2]: event dispatcher
3. [Baobab][3]: Single data store

We are using flux-alike architecture, views can emit events, ask to do actions, and only actions can actually alter db states.

Views use utils.BindData to get informed data updates.

    [View] (mithril component) <------------------\
             |                                    |
             |                                    |
        emit action                       inform data update
             |                                    |
             V                                    |
    [Actions] (EventEmitter listening)            |
             |                                    |
             |                                    |
     do actions, alter app state                  |
             |                                    |
             \------> [Data Store] (Boabab) ------/


# Webpack modules/plugins

* precss
* autoprefixer
* postcss
* HtmlWebpackPlugin
* ExtractTextPlugin: For production build style.css

# License

The MIT License (MIT)

    Copyright (C) 2016 <curist.cyc@gmail.com>
    
    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.




[1]: http://mithril.js.org/
[2]: https://nodejs.org/api/events.html
[3]: https://github.com/Yomguithereal/baobab
