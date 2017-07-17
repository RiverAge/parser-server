/**
 * AdaptableController.ts
 * AdaptableController is the base class for all controller
 * that support adapter,
 * the super class takes care of creating the right instance for the adapter
 * based on the parameters passed
 */

// _adapter is private, use Symbol

const _adapter = Symbol()

import Config from '../Config'
