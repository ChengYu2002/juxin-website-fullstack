# Juxin Enterprise RAG Knowledge Sources

本目录用于维护巨鑫售前 Agent 的企业非结构化知识。这里的内容未来会被切片、向量化并写入 `knowledge_chunks`，但原始 Markdown 才是可审计的知识源。

## 知识边界

- 产品型号、MOQ、尺寸、承重、颜色、装箱量、重量等结构化事实继续由 `searchProducts` / `getProduct` 查询 MongoDB。
- 公司介绍、制造能力、OEM/ODM、质量控制、认证、样品、包装、物流、售后和合作流程进入 RAG。
- 实时价格、库存、交期、运费和需要谈判的商务承诺不写成固定答案，只描述确认流程并转人工。
- 客户个人信息、内部成本、密钥、未公开供应商资料和未经批准的营销声明禁止进入本目录。

## 文件状态

每个知识文件都带有 front matter：

```yaml
status: draft        # draft | approved | retired
version: 1
owner: ""
last_verified: ""
source_refs: []
```

索引脚本应只处理 `status: approved` 的文件，并拒绝仍包含 `[待填写]` 的内容。

状态含义：

- `draft`：仍在填写或等待业务确认，不允许进入生产索引。
- `approved`：内容、来源、负责人和核验日期完整，可以进入生产索引。
- `retired`：已失效，保留审计记录但不参与检索。

## 填写规则

1. 一个 `## KB-...` 小节只回答一个核心问题。
2. `Approved answer` 写可以直接给海外买家看的英文事实；Agent 可按用户语言翻译。
3. `Conditions / exceptions` 写适用范围、例外和前提，不能只写营销口号。
4. `Must not claim` 写模型绝不能扩大解释的内容。
5. `Escalation` 写缺少信息或需要业务员时的处理方式。
6. `Evidence` 必须能追溯到制度、证书、合同模板、官网页面或负责人确认。
7. 动态信息不要用“通常”“大概”包装成事实；不能稳定公开就转人工。
8. 修改事实时增加 `version` 并更新 `last_verified`，不要悄悄覆盖来源。

## 建议索引字段

每个切片最终至少保留：

```js
{
  documentId,
  entryId,
  topic,
  title,
  content,
  language,
  version,
  lastVerified,
  owner,
  sourceRefs,
  appliesTo,
  sensitivity,
  embedding
}
```

## 建议实施顺序

第一批优先完成：

1. `01-company-profile.md`
2. `04-oem-odm.md`
3. `05-quality-control.md`
4. `06-certifications.md`
5. `07-sample-policy.md`
6. `10-packaging.md`
7. `11-shipping-logistics.md`
8. `13-cooperation-process.md`
9. `15-human-escalation.md`
10. `16-unsupported-claims.md`

目标不是文档数量，而是先形成 40–60 个经过批准、单一事实清楚的知识单元。

## 文件清单

- `_entry-template.md`：新增知识单元时复制的标准模板。
- `00-rag-answer-policy.md`：RAG 的回答边界与冲突处理。
- `01-company-profile.md`：公司身份、地点、市场和联系方式。
- `02-manufacturing-capabilities.md`：工艺、设备、产能和验厂。
- `03-product-scope.md`：产品类别与适用场景，不保存单品动态规格。
- `04-oem-odm.md`：Logo、颜色、包装、结构和模具开发。
- `05-quality-control.md`：来料、制程、成品、验货和投诉调查。
- `06-certifications.md`：每份证书的真实覆盖范围和有效期。
- `07-sample-policy.md`：样品资格、费用、运输和确认流程。
- `08-commercial-policy.md`：MOQ 原则、报价因素、付款和经销政策。
- `09-production-lead-time.md`：排产、进度和交期确认流程。
- `10-packaging.md`：标准及定制包装、标签和包装稿确认。
- `11-shipping-logistics.md`：运输方式、港口、单证和责任边界。
- `12-after-sales.md`：保修、质量投诉、证据和处理方案。
- `13-cooperation-process.md`：从询问到售后的完整合作步骤。
- `14-faq.md`：买家高频问题的标准答案。
- `15-human-escalation.md`：必须人工介入的情况和需要收集的字段。
- `16-unsupported-claims.md`：明确禁止模型承诺或推断的内容。

