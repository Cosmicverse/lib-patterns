/**
 * BSD 3-Clause License
 *
 * Copyright (c) 2022, Daniel Jonathan <daniel at cosmicverse dot org>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @module Proxy
 */

import {
  PartialRecord,
  clone,
  guardFor,
  FoundationTypeError,
} from '@cosmicverse/foundation'

/**
 * The `ProxyPropertyKey` defines the allowable keys for
 * a given type `T`.
 */
export type ProxyPropertyKey<T> = keyof T extends string | symbol ? keyof T : never

/**
 * The `ProxyPropertyValidator` defined the `Record` types
 * used in validation blocks.
 */
export type ProxyPropertyValidator<T, K extends keyof T = keyof T> = PartialRecord<K, { validate(value: T[K], state: Readonly<T>): boolean }>

/**
 * The `ProxyValidationError`.
 */
export class ProxyValidationError extends FoundationTypeError {}

/**
 * The `createProxyHandler` prepares the `ProxyHandler` for
 * the given `validator`.
 */
export function createProxyHandler<T extends object>(target: T, validator: ProxyPropertyValidator<T>): ProxyHandler<T> {
  let state = clone(target) as Readonly<T>

  return {
    /**
     * The `set` updates the given property with the given value..
     */
    set<P extends ProxyPropertyKey<T>, V extends T[P]>(target: T, prop: P, value: V): boolean | never {
      validateProxyProperty(prop, value, validator, state)

      if (guardFor(target, prop)) {
        state = clone(target) as Readonly<T>
        return Reflect.set(target, prop, value)
      }
      else {
        return false
      }
    },
  }
}

/**
 * The `validateProxyProperty` validates the given `value`,
 * against the given `validator` tests.
 */
export function validateProxyProperty<T extends object, P extends keyof T, V extends T[P]>(prop: P, value: V, validator: ProxyPropertyValidator<T>, state: Readonly<T>): void | never {
  if ('undefined' !== typeof validator[prop] && true !== validator[prop].validate(value, state)) {
    throw new ProxyValidationError(`${String(prop)} is invalid`)
  }
}

/**
 * The `createProxy` creates a new `Proxy` instance with the
 * given `target` and `validator`.
 */
export const createProxy = <T extends object>(target: T, validator: ProxyPropertyValidator<T> = {}): T | never => {
  for (const prop in target) {
    validateProxyProperty(prop, target[prop], validator, {} as Readonly<Partial<T>>)
  }
  return new Proxy(target, createProxyHandler(target, validator))
}