import {Command} from '@oclif/core'
import {CommandError} from '@oclif/core/interfaces'
import path from 'node:path'

import {canReadFile, isFile} from '@/lib/fs/fs.js'

import {invariant, INVARIANT_ERROR_PREFIX, InvariantErrorCode, invariantErrorMessage} from './invariant.js'

export default abstract class BaseCommand extends Command {
  protected async catch(err: CommandError) {
    if (err.message.startsWith(INVARIANT_ERROR_PREFIX)) {
      const code = err.message.replace(INVARIANT_ERROR_PREFIX, '') as InvariantErrorCode

      this.error(invariantErrorMessage[code], {code, exit: 1})
    } else {
      throw err
    }
  }

  /**
   * Resolves the path to the Lingui configuration file within a given project directory
   * and ensures that the file is readable.
   *
   * @param projectDir - The directory path of the project where the Lingui configuration file is expected.
   * @return A promise that resolves to both the project directory and the resolved config file path.
   * @throws Throws an error if the configuration file is not readable or missing.
   */
  protected async getConfigFile(projectDir: string) {
    const isProjectDirAFile = await isFile(projectDir)

    if (isProjectDirAFile) {
      const linguiConfigFilePath = path.resolve(projectDir)
      const isLinguiConfigFileReadable = await canReadFile(linguiConfigFilePath)
      invariant(isLinguiConfigFileReadable, 'missing_lingui_config_file')
      return {directory: path.dirname(linguiConfigFilePath), file: linguiConfigFilePath}
    }

    const tsConfigPath = path.resolve(projectDir, 'lingui.config.ts')
    if (await canReadFile(tsConfigPath)) {
      return {directory: path.dirname(tsConfigPath), file: tsConfigPath}
    }

    const jsConfigPath = path.resolve(projectDir, 'lingui.config.js')
    const isJsConfigReadable = await canReadFile(jsConfigPath)
    invariant(isJsConfigReadable, 'missing_lingui_config_file')

    return {directory: path.dirname(jsConfigPath), file: jsConfigPath}
  }
}
