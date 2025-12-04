import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { Tree, Icon, Menu, Dropdown, Button, Modal, Input, Spin, message } from "antd";
import "./FileSidebar.css";

const { TreeNode } = Tree;
const { confirm } = Modal;

@inject("fileSystem")
@inject("content")
@observer
class FileSidebar extends Component {
    state = {
        renameModalVisible: false,
        renameId: null,
        newName: "",
        articleModalVisible: false,
        articleName: "",
        articleParentId: null,
        folderModalVisible: false,
        folderName: "",
    };

    componentDidUpdate(prevProps) {
        // When currentFileId changes, update editor content
        const { currentFileId, currentFile } = this.props.fileSystem;
        if (currentFileId !== prevProps.fileSystem.currentFileId && currentFile && currentFile.type === "file") {
            const content = currentFile.content == null ? "" : currentFile.content;
            this.props.content.setContent(content);
        }
    }

    onSelect = (selectedKeys, info) => {
        if (selectedKeys.length > 0) {
            const id = selectedKeys[0];
            const node = this.props.fileSystem.findNode(this.props.fileSystem.files, id);
            if (node) {
                if (node.type === "file") {
                    this.props.fileSystem.setCurrentFileId(id);
                    this.props.content.setContent(node.content == null ? "" : node.content);
                } else if (node.type === "folder") {
                    // Toggle folder expansion
                    const { expandedKeys } = this.props.fileSystem;
                    const index = expandedKeys.indexOf(id);
                    if (index > -1) {
                        // Collapse
                        this.props.fileSystem.setExpandedKeys(expandedKeys.filter(key => key !== id));
                    } else {
                        // Expand
                        this.props.fileSystem.setExpandedKeys([...expandedKeys, id]);
                    }
                }
            }
        }
    };

    onExpand = (expandedKeys) => {
        this.props.fileSystem.setExpandedKeys(expandedKeys);
    };

    handleAddFolder = () => {
        this.setState({
            folderModalVisible: true,
            folderName: "",
        });
    };

    handleFolderOk = () => {
        const { folderName, folderModalVisible } = this.state;
        // Prevent double submission
        if (!folderModalVisible) return;

        const trimmedName = folderName.trim();
        if (!trimmedName) {
            message.warning("文件夹名称不能为空");
            return;
        }
        if (trimmedName.length > 50) {
            message.warning("文件夹名称不能超过50个字符");
            return;
        }

        this.setState({ folderModalVisible: false, folderName: "" });
        this.props.fileSystem.addFolder(null, trimmedName);
    };

    handleFolderCancel = () => {
        this.setState({ folderModalVisible: false, folderName: "" });
    };

    handleAddFile = (parentId) => {
        this.setState({
            articleModalVisible: true,
            articleName: "",
            articleParentId: parentId,
        });
    };

    handleArticleOk = () => {
        const { articleName, articleParentId, articleModalVisible } = this.state;
        // Prevent double submission
        if (!articleModalVisible) return;

        const trimmedName = articleName.trim();
        if (!trimmedName) {
            message.warning("文章名称不能为空");
            return;
        }
        if (trimmedName.length > 50) {
            message.warning("文章名称不能超过50个字符");
            return;
        }

        this.setState({ articleModalVisible: false, articleName: "" });
        this.props.fileSystem.addFile(articleParentId, trimmedName);
        // Update editor content to show the new article with H1 title
        const newContent = `# ${trimmedName}\n\n`;
        this.props.content.setContent(newContent);
    };

    handleArticleCancel = () => {
        this.setState({ articleModalVisible: false, articleName: "" });
    };

    handleDelete = (id) => {
        const node = this.props.fileSystem.findNode(this.props.fileSystem.files, id);
        const isFolder = node && node.type === "folder";

        confirm({
            title: `确定要删除${isFolder ? '文件夹' : '文章'}吗?`,
            content: isFolder ? "将删除该文件夹及其所有子文件夹和文章，删除后无法恢复" : "删除后无法恢复",
            okText: "确定",
            okType: "danger",
            cancelText: "取消",
            onOk: () => {
                this.props.fileSystem.deleteItem(id);
            },
        });
    };

    handleRenameClick = (id, title) => {
        this.setState({
            renameModalVisible: true,
            renameId: id,
            newName: title,
        });
    };

    handleRenameOk = () => {
        const { renameId, newName } = this.state;
        if (newName.trim()) {
            this.props.fileSystem.renameItem(renameId, newName);
            this.setState({ renameModalVisible: false });
        }
    };

    handleRenameCancel = () => {
        this.setState({ renameModalVisible: false });
    };

    renderTreeNodes = (data) =>
        data.map((item) => {
            const isFolder = item.type === "folder";
            const title = (
                <div className="sidebar-tree-title">
                    <span className="sidebar-tree-title-text">
                        {isFolder ? <Icon type="folder" /> : <Icon type="file-markdown" />} {item.title}
                    </span>
                    <div className="sidebar-tree-actions" onClick={(e) => e.stopPropagation()}>
                        {isFolder && (
                            <Icon type="plus" onClick={(e) => { e.stopPropagation(); this.handleAddFile(item.id); }} title="新建文章" />
                        )}
                        <Icon type="edit" onClick={(e) => { e.stopPropagation(); this.handleRenameClick(item.id, item.title); }} title="重命名" />
                        <Icon type="delete" onClick={(e) => { e.stopPropagation(); this.handleDelete(item.id); }} title="删除" />
                    </div>
                </div>
            );

            if (item.children) {
                return (
                    <TreeNode title={title} key={item.id} dataRef={item}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode title={title} key={item.id} dataRef={item} />;
        });

    render() {
        const { files, expandedKeys, currentFileId } = this.props.fileSystem;

        return (
            <div className="nice-file-sidebar">
                <div className="file-sidebar-header">
                    <Button type="primary" icon="folder-add" onClick={this.handleAddFolder}>
                        新建文件夹
                    </Button>
                </div>
                <div className="file-sidebar-content">
                    <Spin spinning={this.props.fileSystem.loading}>
                        <Tree
                            showLine
                            onSelect={this.onSelect}
                            onExpand={this.onExpand}
                            expandedKeys={expandedKeys.slice()}
                            selectedKeys={currentFileId ? [currentFileId] : []}
                        >
                            {this.renderTreeNodes(files)}
                        </Tree>
                    </Spin>
                </div>

                <Modal
                    title="重命名"
                    visible={this.state.renameModalVisible}
                    onOk={this.handleRenameOk}
                    onCancel={this.handleRenameCancel}
                    okText="确定"
                    cancelText="取消"
                >
                    <Input
                        value={this.state.newName}
                        onChange={(e) => this.setState({ newName: e.target.value })}
                        onPressEnter={this.handleRenameOk}
                    />
                </Modal>

                <Modal
                    title="新建文章"
                    visible={this.state.articleModalVisible}
                    onOk={this.handleArticleOk}
                    onCancel={this.handleArticleCancel}
                    okText="确定"
                    cancelText="取消"
                >
                    <Input
                        placeholder="请输入文章名称"
                        value={this.state.articleName}
                        onChange={(e) => this.setState({ articleName: e.target.value })}
                        onPressEnter={this.handleArticleOk}
                    />
                </Modal>

                <Modal
                    title="新建文件夹"
                    visible={this.state.folderModalVisible}
                    onOk={this.handleFolderOk}
                    onCancel={this.handleFolderCancel}
                    okText="确定"
                    cancelText="取消"
                >
                    <Input
                        placeholder="请输入文件夹名称"
                        value={this.state.folderName}
                        onChange={(e) => this.setState({ folderName: e.target.value })}
                        onPressEnter={this.handleFolderOk}
                    />
                </Modal>
            </div>
        );
    }
}

export default FileSidebar;
