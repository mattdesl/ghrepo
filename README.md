# ghrepo

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Creates a new GitHub repository from your current folder, and then runs the initial `git` commands to commit and push the contents. If the folder has a `package.json` it will pull the repo's `description`, `name` and `homepage` from that. 

Install:

```sh
npm install ghrepo -g
```

The example below pushes the contents of `my-module` to a new GitHub repository with the specified commit message. On first run, it will [prompt for authentication](https://github.com/rvagg/ghauth).

```sh
cd my-module
ghrepo -m 'first commit yolo'
```

Result:

![result](http://i.imgur.com/5bz7JCW.png)

## Usage

[![NPM](https://nodei.co/npm/ghrepo.png)](https://www.npmjs.com/package/ghrepo)

```
Usage
  ghrepo [opts]

Options:
  --name, -n          the name of the repository
  --description, -d   the description
  --homepage, -h      the homepage URL
  --private, -p       mark the repository as private (default false)
  --message, -m       the commit message (default "first commit")
  --bare, -b          do not run any git commands after creating the repo
  --no-open           do not open the GitHub repo in the browser after creation
```

The `--name`, `--description`, and `--homepage` will default to `package.json`. If no `package.json` is found, `--name` defaults to the current folder's name.

#### Default Commit Message

You can personalize the default commit message with npm config:

```sh
npm config set init.ghrepo.message 'YOLO!'
```

Now `--message` will default to `'YOLO!'`.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/ghrepo/blob/master/LICENSE.md) for details.
