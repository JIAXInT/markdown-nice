import React, { Component } from "react";
import { Form, Input, Button, message } from "antd";
import { AWS_S3_IMAGE_HOSTING } from "../../utils/constant";

const FormItem = Form.Item;

class AWS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            accessKeyId: "",
            secretAccessKey: "",
            bucket: "",
            region: "",
            endpoint: "",
            publicUrl: "",
            path: "",
        };
    }

    componentDidMount() {
        const config = JSON.parse(window.localStorage.getItem(AWS_S3_IMAGE_HOSTING));
        this.setState({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            bucket: config.bucket,
            region: config.region,
            endpoint: config.endpoint,
            publicUrl: config.publicUrl,
            path: config.path,
        });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const config = JSON.stringify(values);
                window.localStorage.setItem(AWS_S3_IMAGE_HOSTING, config);
                message.success("配置保存成功");
            }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit} className="login-form">
                <FormItem label="AccessKeyId">
                    {getFieldDecorator("accessKeyId", {
                        initialValue: this.state.accessKeyId,
                        rules: [{ required: true, message: "请输入 AccessKeyId" }],
                    })(<Input placeholder="AccessKeyId" />)}
                </FormItem>
                <FormItem label="SecretAccessKey">
                    {getFieldDecorator("secretAccessKey", {
                        initialValue: this.state.secretAccessKey,
                        rules: [{ required: true, message: "请输入 SecretAccessKey" }],
                    })(<Input placeholder="SecretAccessKey" type="password" />)}
                </FormItem>
                <FormItem label="Bucket">
                    {getFieldDecorator("bucket", {
                        initialValue: this.state.bucket,
                        rules: [{ required: true, message: "请输入 Bucket" }],
                    })(<Input placeholder="Bucket" />)}
                </FormItem>
                <FormItem label="Region (可选，留空将使用 'auto')">
                    {getFieldDecorator("region", {
                        initialValue: this.state.region,
                        rules: [{ required: false }],
                    })(<Input placeholder="例如: us-east-1 或 auto (留空默认为 auto)" />)}
                </FormItem>
                <FormItem label="Endpoint (可选，用于兼容 S3 的服务如 Cloudflare R2)">
                    {getFieldDecorator("endpoint", {
                        initialValue: this.state.endpoint,
                        rules: [{ required: false }],
                    })(<Input placeholder="S3 API Endpoint (例如: https://<accountid>.r2.cloudflarestorage.com)" />)}
                </FormItem>
                <FormItem label="公开访问域名 (必填，用于生成图片链接)">
                    {getFieldDecorator("publicUrl", {
                        initialValue: this.state.publicUrl,
                        rules: [{ required: true, message: "请输入公开访问域名" }],
                    })(<Input placeholder="例如: https://yourdomain.com 或 R2 公开域名" />)}
                </FormItem>
                <FormItem label="上传路径 (支持 {year}, {month}, {fullName} 变量)">
                    {getFieldDecorator("path", {
                        initialValue: this.state.path,
                        rules: [{ required: true, message: "请输入上传路径" }],
                    })(<Input placeholder="例如: {year}/{month}/{fullName}" />)}
                </FormItem>
                <FormItem>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        保存配置
                    </Button>
                </FormItem>
            </Form>
        );
    }
}

export default Form.create()(AWS);
