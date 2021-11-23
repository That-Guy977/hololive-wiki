const fetch = require('node-fetch');
const { isBefore } = require('date-fns');
const semverValid = require('semver/functions/valid');
const packageData = require('../package.json');
const { Headers } = fetch;

//-- Add request data typedef

/**
 * Manages requests to the Hololive Fan Wiki
 * @class
 */
class HololiveWiki {
  /**
   * @param {HololiveWikiOptions} [options] - Options to use when sending requests
   */
  constructor({
    requestTimeout,
    requestInterval,
    userAgent = {
      name: `${packageData.name} bot for Node`,
      version: packageData.version,
      contact: [`https://github.com/${packageData.repository}`, packageData.author.match(/<(.+)>/)[1]]
    }
  } = {}) {
    /**
     * Time to wait before cancelling a request, in milliseconds
     * @type {number}
     * @default 10000
     * @readonly
     */
    this.requestTimeout = requestTimeout ?? 10000;

    /**
     * Time to wait between each bundled request, in milliseconds
     * @type {number}
     * @default 1000
     * @readonly
     */
    this.requestInterval = requestInterval ?? 1000;

    /**
     * Name of the User-Agent
     * @type {string}
     * @readonly
     */
    this.name = userAgent.name;

    /**
     * Version of the User-Agent
     * @type {string}
     * @readonly
     */
    this.version = userAgent.version;

    /**
     * Contact info of the User-Agent
     * @type {string}
     * @readonly
     */
    this.contact = userAgent.contact === null
      ? ""
      : typeof userAgent.contact === 'string'
        ? userAgent.contact.replace(/^\((.+)\)$/, "$1")
        : Array.isArray(userAgent.contact) && userAgent.contact.every((element) => typeof element === 'string')
          ? userAgent.contact.join("; ")
          : userAgent.contact;

    this.#validateOptions();
    this.#generateHeaders();
    Object.freeze(this);
  }

  /**
   * Manages requests
   * @type {Object}
   * @property {RequestData[]} queue - Queue for pending requests
   * @property {number} nextReq - Timestamp for the next request
   * @property {?number} timeout - Timeout ID for next scheduled request
   * @private
   */
  #requestManager = {
    queue: [],
    nextReq: 0,
    timeout: null
  };

  /**
   * Sets requests
   * @param {RequestData} data - Request data to use
   * @private
   */
  #setRequest(data) {
    this.#requestManager.queue.push(data);
    if (!this.#requestManager.timeout)
      this.#requestManager.timeout = setTimeout(
        this.#sendRequests,
        isBefore(this.#requestManager.nextReq, Date.now())
          ? this.requestInterval
          : this.#requestManager.nextReq - Date.now()
      );
  }

  /**
   * Sends accumulated requests from {@link #requestManager.queue}
   * @private
   */
  #sendRequests() {
    this.#requestManager.nextReq = Date.now() + this.requestInterval;
    const controller = new AbortController();
    const timeout = setTimeout(controller.abort, this.requestTimeout);
    const params = {
      action: 'query',
      format: 'json'
    };
    fetch(`https://hololive.wiki/w/api.php?${new URLSearchParams(params)}`, {
      method: 'GET',
      headers: this.headers,
      signal: controller.signal
    }).then(() => {
      //-- handle recieve
      // use events to handle back to the promise
    }).catch(() => {
      //-- handle error
      // use events to handle back to the promise
      // remove timeout if retryAfter
      // add retryLimit?
    }).finally(() => clearTimeout(timeout));
  }

  /**
   * Validates options provided to the constructor
   * @throws {TypeError} When data is an invalid type
   * @throws {RangeError} When data is invalid
   * @private
   */
  #validateOptions() {
    if (typeof this.requestTimeout !== 'number') throw new TypeError(`requestTimeout: Expected number; recieved ${typeof this.requestTimeout}`);
    if (this.requestTimeout < 500) throw new RangeError(`requestTimeout: Minimum is 500; recieved ${this.requestTimeout}`);
    if (this.requestTimeout > 30000) throw new RangeError(`requestTimeout: Maximum is 30000; recieved ${this.requestTimeout}`);

    if (typeof this.requestInterval !== 'number') throw new TypeError(`requestInterval: Expected number; recieved ${typeof this.requestInterval}`);
    if (this.requestInterval < 500) throw new RangeError(`requestInterval: Minimum is 500; recieved ${this.requestInterval}`);
    if (this.requestInterval > 5000) throw new RangeError(`requestInterval: Maximum is 5000; recieved ${this.requestInterval}`);

    if (typeof this.name !== 'string') throw new TypeError(`userAgent.name: Expected string; recieved ${typeof this.name}`);
    if (this.name.length > 256) throw new RangeError(`userAgent.name: Maximum length is 256; recieved ${this.name.length}`);
    if (!this.name.toLowerCase().includes("bot")) throw new RangeError("userAgent.name: Name must include the phrase 'bot'");

    if (typeof this.version !== 'string') throw new TypeError(`userAgent.version: Expected string; recieved ${typeof this.version}`);
    if (!semverValid(this.version)) throw new RangeError("userAgent.version: Version must be a valid semver string");

    if (typeof this.contact !== 'string') throw new TypeError(`userAgent.contact: Expected string|string[]|null; recieved ${typeof this.contact}`);
    if (this.contact.length > 256) throw new RangeError(`userAgent.contact: Maximum length is 256; recieved ${this.contact.length}`);
  }

  /**
   * Generates request headers
   * @private
   */
  #generateHeaders() {
    /**
     * The full User-Agent string
     * @type {string}
     * @readonly
     */
    this.userAgent = `${this.name}/${this.version} ${this.contact ? `(${this.contact}) ` : ""}${packageData.name}/${packageData.version}`;

    /**
     * Headers to send in each request
     * @type {Headers}
     * @readonly
     */
    this.headers = new Headers({
      'User-Agent': this.userAgent,
      'Accept-Encoding': 'gzip',
      'Connection': 'keep-alive'
    });

    Object.defineProperties(this, {
      userAgent: { enumerable: false },
      headers: { enumerable: false }
    });
  }
}

module.exports = HololiveWiki;

/**
 * @typedef HololiveWikiOptions
 * @property {number} [requestTimeout=10000] - Time to wait before cancelling a request, in milliseconds
 * @property {number} [requestInterval=1000] - Time to wait between each bundled request, in milliseconds
 * @property {UserAgentOptions} [userAgent] - Options to construct a User-Agent header
 */

/**
 * @typedef UserAgentOptions
 * @property {string} name - The package name to use in the User-Agent
 * @property {string} version - The package version to use in the User-Agent
 * @property {?(string|string[])} contact - The contact info to use in the User-Agent
 */
