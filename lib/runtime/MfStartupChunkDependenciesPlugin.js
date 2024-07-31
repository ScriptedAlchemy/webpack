"use strict";

const RuntimeGlobals = require("../RuntimeGlobals");
const StartupChunkDependenciesRuntimeModule = require("./StartupChunkDependenciesRuntimeModule");
const ContainerEntryModule = require("../container/ContainerEntryModule");
const StartupEntrypointRuntimeModule = require("./StartupEntrypointRuntimeModule");

/** @typedef {import("../../declarations/WebpackOptions").ChunkLoadingType} ChunkLoadingType */
/** @typedef {import("../Chunk")} Chunk */
/** @typedef {import("../Compiler")} Compiler */

/**
 * @typedef {object} Options
 * @property {ChunkLoadingType} chunkLoading
 * @property {boolean=} asyncChunkLoading
 */

class StartupChunkDependenciesPlugin {
	/**
	 * @param {Options} options options
	 */
	constructor(options) {
		this.asyncChunkLoading = options.asyncChunkLoading || true;
	}

	/**
	 * Apply the plugin
	 * @param {Compiler} compiler the compiler instance
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.thisCompilation.tap(
			"StartupChunkDependenciesPlugin",
			compilation => {
				/**
				 * @param {Chunk} chunk chunk to check
				 * @returns {boolean} true, when the plugin is enabled for the chunk
				 */
				const isEnabledForChunk = chunk => {
					const entrymodule = chunk.entryModule;
					return !(entrymodule instanceof ContainerEntryModule);
				};

				compilation.hooks.additionalTreeRuntimeRequirements.tap(
					"StartupChunkDependenciesPlugin",
					(chunk, set) => {
						if (!isEnabledForChunk(chunk)) return;

						set.add(RuntimeGlobals.startup);
						set.add(RuntimeGlobals.ensureChunk);
						set.add(RuntimeGlobals.ensureChunkIncludeEntries);
						compilation.addRuntimeModule(
							chunk,
							new StartupChunkDependenciesRuntimeModule(
								this.asyncChunkLoading,
								true
							)
						);
					}
				);

				compilation.hooks.additionalChunkRuntimeRequirements.tap(
					"StartupChunkDependenciesPlugin",
					(chunk, set) => {
						if (chunk.hasRuntime()) return;
						set.add(RuntimeGlobals.startup);
						set.add(RuntimeGlobals.federationEntryStartup);
						set.add(RuntimeGlobals.startupEntrypoint);
					}
				);

				compilation.hooks.runtimeRequirementInTree
					.for(RuntimeGlobals.startupEntrypoint)
					.tap("StartupChunkDependenciesPlugin", (chunk, set) => {
						if (!isEnabledForChunk(chunk)) return;
						set.add(RuntimeGlobals.require);
						set.add(RuntimeGlobals.ensureChunk);
						set.add(RuntimeGlobals.ensureChunkIncludeEntries);
						compilation.addRuntimeModule(
							chunk,
							new StartupEntrypointRuntimeModule(this.asyncChunkLoading)
						);
					});
			}
		);
	}
}

module.exports = StartupChunkDependenciesPlugin;
