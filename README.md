# Node Basic Authentication Examples

[![Build status][travis-image]][travis-url] [![Code Climate][codeclimate-image]][codeclimate-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependencies][david-image]][david-url]

This is a basic single-page web application that shows how to implement both
cookie and token based authentication in a Node.js API server. The code is for
illustrative purposes only and if you need authentication,
[Passport](http://passportjs.org) or
[Admit One](https://github.com/wbyoung/admit-one) would be solutions you should
consider.

Run the app with either:  
`AUTH='cookie' node index.js`  
`AUTH='token' node index.js`  

A token version is [running here](http://node-basic-auth-examples.herokuapp.com).

## License

This project is distributed under the MIT license.

[travis-url]: http://travis-ci.org/wbyoung/node-basic-auth-examples
[travis-image]: https://secure.travis-ci.org/wbyoung/node-basic-auth-examples.png?branch=master
[codeclimate-image]: https://codeclimate.com/github/wbyoung/node-basic-auth-examples.png
[codeclimate-url]: https://codeclimate.com/github/wbyoung/node-basic-auth-examples
[coverage-image]: https://coveralls.io/repos/wbyoung/node-basic-auth-examples/badge.png
[coverage-url]: https://coveralls.io/r/wbyoung/node-basic-auth-examples
[david-image]: https://david-dm.org/wbyoung/node-basic-auth-examples.png?theme=shields.io
[david-url]: https://david-dm.org/wbyoung/node-basic-auth-examples
