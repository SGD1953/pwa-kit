#!/usr/bin/env node
/* eslint-env node */

const path = require('path')
const childProc = require('child_process')

const bundlesNames = ['main', 'client-optional', 'server-renderer', 'ssr', 'request-processor']

/**
 * Send bundle size stats to Datadog
 */
const main = () => {
    bundlesNames.forEach(name => {
        const pwaStats = require(path.join(path.resolve(''), 'packages', 'pwa', 'build', `${name}.json`))

        const bundles = pwaStats.assets
        bundles.forEach((bundle) => {
            const metric = `mobify_platform_sdks.bundle_size_byte`
            const value = bundle.size
            childProc.spawnSync('dog', ['metric', 'post', metric, value, '--host', bundle.name])
            console.log(`${metric} ${value} --host ${bundle.name}`)
        })
    })
}

main()
