import { observable, action, computed, runInAction } from "mobx";
import { message } from "antd";

import contentStore from "./content";

// Replace with your actual Worker URL after deployment
const API_BASE_URL = "https://markdown-nice-worker.1131918725.workers.dev/api/files";

class FileSystem {
    @observable files = []; // Tree structure
    @observable currentFileId = null;
    @observable expandedKeys = [];
    @observable loading = false;

    constructor() {
        this.fetchFiles();
    }

    @action
    fetchFiles = async () => {
        this.loading = true;
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await fetch(API_BASE_URL);
                if (response.ok) {
                    const flatFiles = await response.json();
                    const tree = this.buildTree(flatFiles);
                    runInAction(() => {
                        this.files = tree;
                        // Restore last opened file
                        const lastFileId = localStorage.getItem("currentFileId");
                        if (lastFileId) {
                            const node = this.findNode(tree, lastFileId);
                            if (node && node.type === "file") {
                                this.currentFileId = lastFileId;
                                const content = node.content == null ? "" : node.content;
                                contentStore.setContent(content);
                            }
                        }
                    });
                    break; // Success
                } else {
                    console.error(`Failed to fetch files: ${response.status} ${response.statusText}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                console.error(`Error fetching files (attempts left: ${retries - 1}):`, error);
                retries--;
                if (retries === 0) {
                    message.error(`无法连接到数据库: ${error.message}. 请检查网络或配置`);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }
        }

        runInAction(() => {
            this.loading = false;
        });
    };

    buildTree(flatFiles) {
        const root = [];
        const map = {};

        flatFiles.forEach((file) => {
            file.children = [];
            // Ensure content is never null
            if (file.content == null) {
                file.content = "";
            }
            map[file.id] = file;
        });

        flatFiles.forEach((file) => {
            if (file.parent_id) {
                if (map[file.parent_id]) {
                    map[file.parent_id].children.push(file);
                }
            } else {
                root.push(file);
            }
        });

        return root;
    }

    @action
    addFolder = async (parentId = null, folderName = "新建文件夹") => {
        const newFolder = {
            id: `folder-${Date.now()}`,
            parent_id: parentId,
            title: folderName,
            type: "folder",
            children: [],
            created_at: Date.now(),
        };

        // Optimistic update
        this.addToTree(newFolder, parentId);

        try {
            await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newFolder),
            });
        } catch (error) {
            console.error("Failed to save folder:", error);
            message.error("保存失败");
            // Revert optimistic update (omitted for brevity)
        }
    };

    @action
    addFile = async (parentId = null, articleName = "新建文章") => {
        const newFile = {
            id: `file-${Date.now()}`,
            parent_id: parentId,
            title: articleName,
            type: "file",
            content: `# ${articleName}\n\n`,
            created_at: Date.now(),
        };

        // Optimistic update
        this.addToTree(newFile, parentId);
        this.currentFileId = newFile.id;

        try {
            await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newFile),
            });
        } catch (error) {
            console.error("Failed to save file:", error);
            message.error("保存失败");
        }
    };

    addToTree(node, parentId) {
        if (!parentId) {
            this.files.push(node);
        } else {
            const parent = this.findNode(this.files, parentId);
            if (parent && parent.type === "folder") {
                parent.children.push(node);
                if (!this.expandedKeys.includes(parentId)) {
                    this.expandedKeys.push(parentId);
                }
            }
        }
    }

    @action
    deleteItem = async (id) => {
        // Check if we're deleting the current file or its parent folder
        const shouldClearEditor = this.currentFileId === id || this.isAncestor(id, this.currentFileId);

        // Optimistic update
        const originalFiles = JSON.parse(JSON.stringify(this.files));
        const originalCurrentFileId = this.currentFileId;

        this.files = this.deleteNode(this.files, id);
        if (shouldClearEditor) {
            this.currentFileId = null;
        }

        try {
            await fetch(`${API_BASE_URL}/${id}`, {
                method: "DELETE",
            });
        } catch (error) {
            console.error("Failed to delete item:", error);
            message.error("删除失败");
            runInAction(() => {
                this.files = originalFiles;
                this.currentFileId = originalCurrentFileId;
            });
        }
    };

    // Check if parentId is an ancestor of childId
    isAncestor(parentId, childId) {
        if (!childId) return false;
        const child = this.findNode(this.files, childId);
        if (!child) return false;

        let current = child;
        while (current && current.parent_id) {
            if (current.parent_id === parentId) return true;
            current = this.findNode(this.files, current.parent_id);
        }
        return false;
    }

    deleteNode(nodes, id) {
        return nodes.filter((node) => {
            if (node.id === id) return false;
            if (node.children) {
                node.children = this.deleteNode(node.children, id);
            }
            return true;
        });
    }

    @action
    renameItem = async (id, newTitle) => {
        const node = this.findNode(this.files, id);
        if (node) {
            const oldTitle = node.title;
            node.title = newTitle;

            try {
                await fetch(`${API_BASE_URL}/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle }),
                });
            } catch (error) {
                console.error("Failed to rename:", error);
                runInAction(() => {
                    node.title = oldTitle;
                });
            }
        }
    };

    @action
    updateFileContent = async (id, content) => {
        const node = this.findNode(this.files, id);
        if (node && node.type === "file") {
            node.content = content;
            // Debounce this in a real app
            try {
                await fetch(`${API_BASE_URL}/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: content }),
                });
            } catch (error) {
                console.error("Failed to update content:", error);
            }
        }
    };

    @action
    setCurrentFileId = (id) => {
        this.currentFileId = id;
        if (id) {
            localStorage.setItem("currentFileId", id);
        } else {
            localStorage.removeItem("currentFileId");
        }
    };

    @action
    setExpandedKeys = (keys) => {
        this.expandedKeys = keys;
    }

    findNode(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = this.findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    @computed
    get currentFile() {
        return this.findNode(this.files, this.currentFileId);
    }
}

const store = new FileSystem();

export default store;
