import { createSignal, type Accessor } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

export function normalizePath(path: string) {
  return path.replace(/^\/+/, '')
}

export function getParentDirectory(path: string) {
  return path.split('/').slice(0, -1).join('/')
}

export function getNameFromPath(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || ''
}


/**********************************************************************************/
/*                                                                                */
/*                                      Types                                     */
/*                                                                                */
/**********************************************************************************/

interface File<T> {
  type: 'file'
  get: Accessor<T>
  set(value: T): void
}
interface Dir {
  type: 'dir'
}

export type DirEnt<T> = File<T> | Dir

export type FileSystem<T> = ReturnType<typeof createFileSystem<T>>

/**********************************************************************************/
/*                                                                                */
/*                                   Create File                                  */
/*                                                                                */
/**********************************************************************************/

export function createFile<T>(initial: T): File<T> {
  const [get, set] = createSignal<T>(initial)

  return {
    type: 'file',
    get,
    set,
  }
}

/**********************************************************************************/
/*                                                                                */
/*                               Create File System                               */
/*                                                                                */
/**********************************************************************************/

export function createFileSystem<T = string>() {
  const [dirEnts, setDirEnts] = createStore<Record<string, DirEnt<T>>>({})

  function assertPathExists(path: string) {
    const parts = path.split('/')
    const pathExists = parts
      .map((_, index) => parts.slice(0, index + 1).join('/'))
      .filter(Boolean)
      .every(path => path in dirEnts)

    if (!pathExists) {
      throw `Path is invalid ${path}`
    }
  }

  function readdir(
    path: string,
    options: { withFileTypes: true },
  ): Array<{ type: 'dir' | 'file'; path: string }>
  function readdir(path: string): Array<string>
  function readdir(path: string, options?: { withFileTypes?: boolean }) {
    path = normalizePath(path)

    assertPathExists(path)

    if (options?.withFileTypes) {
      return Object.entries(dirEnts)
        .filter(([_path]) => getParentDirectory(_path) === path && _path !== path)
        .map(([path, file]) => ({
          type: file.type,
          path,
        }))
    }

    return Object.keys(dirEnts).filter(_path => getParentDirectory(_path) === path)
  }

  const fs = {
    exists(path: string) {
      return path in dirEnts
    },
    getType(path: string): DirEnt<T>['type'] {
      path = normalizePath(path)

      assertPathExists(path)

      return dirEnts[path]!.type
    },
    readdir,
    mkdir(path: string, options?: { recursive?: boolean }) {
      path = normalizePath(path)

      if (options?.recursive) {
        const parts = path.split('/')
        parts.forEach((_, index) => {
          setDirEnts(parts.slice(0, index).join('/'), { type: 'dir' })
        })
        return
      }

      assertPathExists(getParentDirectory(path))

      setDirEnts(path, { type: 'dir' })
    },
    readFile(path: string) {
      path = normalizePath(path)

      assertPathExists(path)

      const dirEnt = dirEnts[path]!

      if (dirEnt.type === 'dir') {
        throw `Path is not a file ${path}`
      }

      return dirEnt.get()
    },
    rename(previous: string, next: string) {
      console.log('rename before', {...dirEnts})

      previous = normalizePath(previous)
      next = normalizePath(next)

      if(fs.exists(next)){
        console.error(dirEnts)
        throw `Path ${next} already exists.`
      }

      if(!fs.exists(previous)){
        console.error(`Path does not exist: ${previous}`)
        return
      }

      setDirEnts(
        produce(files => {
          Object.keys(dirEnts).forEach(path => {
            if (path.startsWith(previous)) {
              const newPath = path.replace(previous, next)
              const file = files[path]!
              files[newPath] = file
              delete files[path]
            }
          })
        }),
      )
      console.log('rename after', {...dirEnts})
    },
    rm(path: string, options?: { force?: boolean; recursive?: boolean }) {
      path = normalizePath(path)

      if (!options || !options.force) {
        assertPathExists(path)
      }

      if (!options || !options.recursive) {
        const _dirEnts = Object.keys(dirEnts).filter(value => {
          if (value === path) return false
          return value.includes(path)
        })

        if (_dirEnts.length > 0) {
          throw `Directory is not empty ${_dirEnts}`
        }
      }

      setDirEnts(
        produce(files => {
          Object.keys(files)
            .filter(value => value.includes(path))
            .forEach(path => delete files[path])
        }),
      )
    },
    writeFile(path: string, source: T) {
      path = normalizePath(path)
      assertPathExists(getParentDirectory(path))

      const dirEnt = dirEnts[path]

      if (dirEnt?.type === 'dir') {
        throw `A directory already exist with the same name: ${path}`
      }

      if (dirEnt) {
        dirEnt.set(source)
      } else {
        setDirEnts(path, createFile(source))
      }
    },
  }

  return fs
}
