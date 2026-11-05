"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderError = void 0;
exports.discoverRawFolders = discoverRawFolders;
exports.createFolder = createFolder;
exports.deleteFolder = deleteFolder;
exports.uploadFiles = uploadFiles;
exports.deleteFile = deleteFile;
exports.moveFile = moveFile;
/**
 * Create/delete folders and move files inside data/raw/, backing the
 * file-explorer dashboard UI.
 *
 * Every operand is checked for
 * symlink-ness and containment *before* being resolved (realpath), never
 * after -- resolving first would follow a symlink to whatever it points
 * at and silently operate on the real target instead of refusing.
 */
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const fsWalk_1 = { walkEntries(dir, callback) {
        if (!node_fs_1.default.existsSync(dir)) return;
        for (const name of node_fs_1.default.readdirSync(dir)) {
            const full = node_path_1.default.join(dir, name);
            let stat;
            try { stat = node_fs_1.default.statSync(full); } catch { continue; }
            callback(full, name, stat);
        }
    } };
const rawFiles_1 = { ALL_SOURCE_EXTENSIONS: new Set(JSON.parse(node_fs_1.default.readFileSync(node_path_1.default.join(__dirname, 'all_source_extensions.json'), 'utf8'))) };
class FolderError extends Error {
}
exports.FolderError = FolderError;
function topSegment(relPath) {
    return relPath.split('/')[0];
}
function assertWithin(rawDir, candidate) {
    const resolved = node_fs_1.default.existsSync(candidate) ? node_fs_1.default.realpathSync(candidate) : node_path_1.default.resolve(candidate);
    const rawResolved = node_fs_1.default.realpathSync(rawDir);
    if (resolved !== rawResolved && !resolved.startsWith(rawResolved + node_path_1.default.sep)) {
        throw new FolderError('Path escapes data/raw/');
    }
}
function checkNotManaged(relPath, managedNames) {
    if (relPath && managedNames.has(topSegment(relPath))) {
        throw new FolderError("This path belongs to a registered source folder -- edit files there directly, or in the Source folders panel.");
    }
}
function discoverRawFolders(rawDir) {
    if (!node_fs_1.default.existsSync(rawDir))
        return [];
    const folders = [];
    const walk = (dir) => {
        (0, fsWalk_1.walkEntries)(dir, (full, name, stat) => {
            if (!stat.isDirectory())
                return;
            if (name.startsWith('.') || name === '_archive')
                return;
            folders.push(node_path_1.default.relative(rawDir, full).split(node_path_1.default.sep).join('/'));
            walk(full);
        });
    };
    walk(rawDir);
    return folders.sort();
}
function createFolder(rawDir, parent, name, managedNames) {
    name = (name || '').trim();
    if (!name)
        throw new FolderError('Folder name is required');
    if (name.includes('/') || name.includes('\\') || name === '.' || name === '..' || name.startsWith('.')) {
        throw new FolderError('Invalid folder name');
    }
    parent = (parent || '').trim().replace(/^\/+|\/+$/g, '');
    checkNotManaged(parent, managedNames);
    const parentDir = parent ? node_path_1.default.join(rawDir, parent) : rawDir;
    assertWithin(rawDir, parentDir);
    if (parent && !(node_fs_1.default.existsSync(parentDir) && node_fs_1.default.statSync(parentDir).isDirectory())) {
        throw new FolderError(`Parent folder not found: ${parent}`);
    }
    const relPath = parent ? `${parent}/${name}` : name;
    checkNotManaged(relPath, managedNames);
    const newDir = node_path_1.default.join(rawDir, relPath);
    assertWithin(rawDir, node_path_1.default.dirname(newDir));
    // No existsSync pre-check: two concurrent requests for the same new
    // folder could both pass it and the second mkdirSync would silently
    // land on a directory the first request just created. mkdirSync without
    // {recursive: true} already fails atomically with EEXIST if the path
    // exists -- catching that instead of checking first closes the race.
    try {
        node_fs_1.default.mkdirSync(newDir);
    }
    catch (err) {
        if (err?.code === 'EEXIST')
            throw new FolderError(`Already exists: ${relPath}`);
        throw err;
    }
    return relPath;
}
function deleteFolder(rawDir, relPath, managedNames) {
    relPath = (relPath || '').trim().replace(/^\/+|\/+$/g, '');
    if (!relPath)
        throw new FolderError('Cannot delete data/raw/ itself');
    checkNotManaged(relPath, managedNames);
    const target = node_path_1.default.join(rawDir, relPath);
    assertWithin(rawDir, target);
    const stat = node_fs_1.default.existsSync(target) ? node_fs_1.default.lstatSync(target) : null;
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new FolderError(`Folder not found: ${relPath}`);
    }
    if (node_fs_1.default.readdirSync(target).length > 0)
        throw new FolderError('Folder is not empty');
    node_fs_1.default.rmdirSync(target);
}
function sanitizeUploadName(originalName) {
    const name = node_path_1.default.basename(originalName || '').trim();
    if (!name || name === '.' || name === '..' || name.startsWith('.')) {
        throw new FolderError(`Invalid file name: ${originalName}`);
    }
    const ext = node_path_1.default.extname(name).toLowerCase();
    if (!rawFiles_1.ALL_SOURCE_EXTENSIONS.has(ext)) {
        throw new FolderError(`Unsupported file type "${ext || '(none)'}" for ${name}`);
    }
    return name;
}
function uploadFiles(rawDir, parent, files, managedNames) {
    if (!files.length)
        throw new FolderError('No files provided');
    parent = (parent || '').trim().replace(/^\/+|\/+$/g, '');
    checkNotManaged(parent, managedNames);
    const destDir = parent ? node_path_1.default.join(rawDir, parent) : rawDir;
    assertWithin(rawDir, destDir);
    if (!(node_fs_1.default.existsSync(destDir) && node_fs_1.default.statSync(destDir).isDirectory())) {
        throw new FolderError(`Destination folder not found: ${parent}`);
    }
    const saved = [];
    for (const file of files) {
        const name = sanitizeUploadName(file.originalName);
        const destination = node_path_1.default.join(destDir, name);
        assertWithin(rawDir, node_path_1.default.dirname(destination));
        // No existsSync pre-check: two concurrent uploads of the same
        // filename could both pass it and the second write would silently
        // clobber the first with no warning to either caller. The 'wx' flag
        // makes the create-and-write atomic at the OS level -- it fails with
        // EEXIST instead of truncating an existing file.
        try {
            node_fs_1.default.writeFileSync(destination, file.buffer, { flag: 'wx' });
        }
        catch (err) {
            if (err?.code === 'EEXIST')
                throw new FolderError(`A file named ${name} already exists there`);
            throw err;
        }
        saved.push(parent ? `${parent}/${name}` : name);
    }
    return saved;
}
function deleteFile(rawDir, relPath, managedNames) {
    relPath = (relPath || '').trim().replace(/^\/+|\/+$/g, '');
    if (!relPath)
        throw new FolderError('File path is required');
    checkNotManaged(relPath, managedNames);
    const target = node_path_1.default.join(rawDir, relPath);
    assertWithin(rawDir, node_path_1.default.dirname(target));
    const stat = node_fs_1.default.existsSync(target) ? node_fs_1.default.lstatSync(target) : null;
    if (!stat || stat.isSymbolicLink() || !stat.isFile()) {
        throw new FolderError(`File not found: ${relPath}`);
    }
    node_fs_1.default.unlinkSync(target);
}
function moveFile(rawDir, sourceRel, destinationDirRel, managedNames) {
    sourceRel = (sourceRel || '').trim().replace(/^\/+|\/+$/g, '');
    destinationDirRel = (destinationDirRel || '').trim().replace(/^\/+|\/+$/g, '');
    if (!sourceRel)
        throw new FolderError('Source path is required');
    checkNotManaged(sourceRel, managedNames);
    checkNotManaged(destinationDirRel, managedNames);
    const source = node_path_1.default.join(rawDir, sourceRel);
    assertWithin(rawDir, node_path_1.default.dirname(source));
    const sourceStat = node_fs_1.default.existsSync(source) ? node_fs_1.default.lstatSync(source) : null;
    if (!sourceStat || sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
        throw new FolderError(`Source file not found: ${sourceRel}`);
    }
    const destDir = destinationDirRel ? node_path_1.default.join(rawDir, destinationDirRel) : rawDir;
    assertWithin(rawDir, destDir);
    if (!(node_fs_1.default.existsSync(destDir) && node_fs_1.default.statSync(destDir).isDirectory())) {
        throw new FolderError(`Destination folder not found: ${destinationDirRel}`);
    }
    const baseName = node_path_1.default.basename(source);
    const destination = node_path_1.default.join(destDir, baseName);
    // No existsSync pre-check, and not a plain renameSync either: POSIX
    // rename() silently overwrites an existing destination rather than
    // failing (unlike mkdir/open with O_EXCL), so a plain rename here would
    // still lose a concurrent write to the same destination path with no
    // warning to either caller. linkSync fails atomically with EEXIST if
    // the destination exists, so link-then-unlink-the-source gives the same
    // move semantics with that race closed (both paths are under rawDir, so
    // always the same filesystem -- link works the same as rename does here).
    try {
        node_fs_1.default.linkSync(source, destination);
    }
    catch (err) {
        if (err?.code === 'EEXIST')
            throw new FolderError(`A file named ${baseName} already exists there`);
        throw err;
    }
    node_fs_1.default.unlinkSync(source);
    return destinationDirRel ? `${destinationDirRel}/${baseName}` : baseName;
}
//# sourceMappingURL=rawFolders.js.map
