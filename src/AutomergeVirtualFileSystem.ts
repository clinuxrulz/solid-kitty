import {
    AutomergeUrl,
    DocHandle,
    isValidAutomergeUrl,
    Repo,
} from "@automerge/automerge-repo";
import { createDocumentProjection } from "automerge-repo-solid-primitives";
import { Accessor, createMemo, createResource } from "solid-js";
import { Store } from "solid-js/store";
import {
    asyncFailed,
    asyncPending,
    AsyncResult,
    asyncSuccess,
} from "./AsyncResult";
import { err, ok, Result } from "./kitty-demo/Result";

export type VfsFile = {
    type: "File";
    docUrl: AutomergeUrl;
};

export type VfsFolder = {
    type: "Folder";
    docUrl: AutomergeUrl;
};

export type VfsFolderContents = {
    contents: {
        [name: string]: VfsFileOrFolder;
    };
};

type VfsFileOrFolder = VfsFile | VfsFolder;

export type AutomergeVirtualFileSystemState = {
    root: {
        docUrl: AutomergeUrl;
    };
};

export class AutomergeVirtualFileSystem {
    private repo: Repo;
    private doc: Accessor<Store<AutomergeVirtualFileSystemState> | undefined>;

    static makeEmptyState(repo: Repo): AutomergeVirtualFileSystemState {
        let doc = repo.create<VfsFolderContents>({
            contents: {},
        });
        return {
            root: { docUrl: doc.url },
        };
    }

    constructor(params: {
        repo: Repo;
        docHandle: Accessor<
            DocHandle<AutomergeVirtualFileSystemState> | undefined
        >;
    }) {
        this.repo = params.repo;
        this.doc = createDocumentProjection(params.docHandle);
    }

    get rootFolderId(): Accessor<AsyncResult<AutomergeUrl>> {
        return createMemo(() => {
            let docUrl = this.doc()?.root?.docUrl;
            if (docUrl == undefined) {
                return asyncPending();
            }
            return asyncSuccess(docUrl);
        });
    }

    readFolder(
        docUrl: string,
    ): Accessor<AsyncResult<DocHandle<VfsFolderContents>>> {
        if (!isValidAutomergeUrl(docUrl)) {
            return () => asyncFailed("not a valid automerge url");
        }
        let [doc] = createResource(() =>
            this.repo.find<VfsFolderContents>(docUrl),
        );
        return createMemo(() => {
            let doc2 = doc();
            if (doc2 == undefined) {
                return asyncPending();
            }
            return asyncSuccess(doc2);
        });
    }

    readFile<T>(docUrl: string): Accessor<AsyncResult<DocHandle<T>>> {
        if (!isValidAutomergeUrl(docUrl)) {
            return () => asyncFailed("not a valid automerge url");
        }
        let [doc] = createResource(() => this.repo.find<T>(docUrl));
        return createMemo(() => {
            let doc2 = doc();
            if (doc2 == undefined) {
                return asyncPending();
            }
            return asyncSuccess(doc2);
        });
    }

    async createFolder(
        parentFolderDocUrl: string,
        folderName: string,
    ): Promise<Result<AutomergeUrl>> {
        if (!isValidAutomergeUrl(parentFolderDocUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderContents = await this.repo.find<VfsFolderContents>(
            parentFolderDocUrl,
        );
        let folderContents = this.repo.create<VfsFolderContents>({
            contents: {},
        });
        parentFolderContents.change((doc) => {
            doc.contents[folderName] = {
                type: "Folder",
                docUrl: folderContents.url,
            };
        });
        return ok(folderContents.url);
    }

    async createFile<T>(
        parentFolderDocUrl: string,
        filename: string,
        data: T
    ): Promise<Result<AutomergeUrl>> {
        if (!isValidAutomergeUrl(parentFolderDocUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderContents = await this.repo.find<VfsFolderContents>(
            parentFolderDocUrl,
        );
        let fileDoc = this.repo.create<T>(data);
        let fileDocUrl = fileDoc.url;
        parentFolderContents.change((doc) => {
            doc.contents[filename] = {
                type: "File",
                docUrl: fileDocUrl,
            };
        });
        return ok(fileDocUrl);
    }

    async addFile(
        parentFolderDocUrl: string,
        filename: string,
        fileDocUrl: AutomergeUrl,
    ): Promise<{}> {
        if (!isValidAutomergeUrl(parentFolderDocUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderDoc =
            await this.repo.find<VfsFolder>(parentFolderDocUrl);
        let parentfolderContentsUrl = parentFolderDoc.doc().docUrl;
        if (!isValidAutomergeUrl(parentfolderContentsUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderContents = await this.repo.find<VfsFolderContents>(
            parentfolderContentsUrl,
        );
        parentFolderContents.change((doc) => {
            doc.contents[filename] = {
                type: "File",
                docUrl: fileDocUrl,
            };
        });
        return ok({});
    }

    async removeFileOrFolder<T>(
        parentFolderDocUrl: string,
        fileOrFolderName: string,
    ): Promise<Result<AutomergeUrl | undefined>> {
        if (!isValidAutomergeUrl(parentFolderDocUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderDoc =
            await this.repo.find<VfsFolder>(parentFolderDocUrl);
        let parentfolderContentsUrl = parentFolderDoc.doc().docUrl;
        if (!isValidAutomergeUrl(parentfolderContentsUrl)) {
            return err("not a valid automerge url");
        }
        let parentFolderContents = await this.repo.find<VfsFolderContents>(
            parentfolderContentsUrl,
        );
        let fileOrFolderBefore = parentFolderContents.doc().contents[fileOrFolderName];
        if (fileOrFolderBefore == undefined) {
            return ok(undefined);
        }
        parentFolderContents.change((doc) => {
            delete doc.contents[fileOrFolderName];
        });
        return ok(fileOrFolderBefore.docUrl);
    }
}
