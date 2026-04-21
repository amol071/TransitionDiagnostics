"""Pydantic models for LDC AI Platform."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone
import uuid


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Roles / Users ----------
Role = Literal["admin", "coordinator", "employee", "manager", "panel", "hr", "hrbp", "stakeholder"]


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    email: str
    name: str
    password_hash: str
    roles: List[str] = Field(default_factory=list)
    emp_id: Optional[str] = None
    created_at: str = Field(default_factory=_now)


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    roles: List[str]
    emp_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: UserPublic


# ---------- Master Data ----------
class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    code: str
    name: str
    short_name: Optional[str] = None


class Function(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    code: str
    name: str


class BusinessUnit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    code: str
    name: str
    company_code: str
    company_id: Optional[str] = None


class Level(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    code: str
    name: str
    band: str
    ldc_level: int = 3  # 1..4
    order: int = 0


# ---------- Employee ----------
class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    emp_id: str
    emp_code: str
    name: str
    email: str
    company: str
    bu: str
    function: str
    level: str
    # Master-data references (optional for backward-compat with older docs)
    company_id: Optional[str] = None
    function_id: Optional[str] = None
    bu_id: Optional[str] = None
    level_id: Optional[str] = None
    manager_id: Optional[str] = None
    hrbp_id: Optional[str] = None
    created_at: str = Field(default_factory=_now)


# ---------- Capabilities ----------
class Capability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    code: str
    name: str
    pillar: str
    pillar_order: int = 0
    gcf: str = ""
    gcf_order: int = 0
    competency_order: int = 0
    level: int = 3  # 1..4 (LDC default L3)
    order: int = 0
    # legacy (optional, unused now but kept for backward-compat)
    category: Optional[str] = None
    current_level_desc: Optional[str] = None
    next_level_desc: Optional[str] = None


# ---------- Case ----------
WorkflowStatus = Literal[
    "draft", "launched", "employee_in_progress", "employee_submitted",
    "manager_in_progress", "manager_submitted", "stakeholder_in_progress",
    "panel_launched", "panel_in_progress", "panel_submitted",
    "hr_in_progress", "hr_submitted", "closed", "reopened"
]


class NomineeCase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    employee_id: str
    fiscal_year: str
    is_renomination: bool = False
    is_launched: bool = False
    is_panel_launched: bool = False
    status: str = "draft"
    assigned_manager_id: Optional[str] = None
    assigned_panel_ids: List[str] = Field(default_factory=list)
    assigned_hrbp_id: Optional[str] = None
    assigned_hr_id: Optional[str] = None
    coordinator_id: Optional[str] = None
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class NomineeCaseCreate(BaseModel):
    employee_id: str
    fiscal_year: str
    is_renomination: bool = False
    assigned_manager_id: Optional[str] = None
    assigned_panel_ids: List[str] = Field(default_factory=list)
    assigned_hrbp_id: Optional[str] = None
    assigned_hr_id: Optional[str] = None


class LaunchBody(BaseModel):
    stage: Literal["case", "panel"] = "case"


# ---------- Forms ----------
class Contribution(BaseModel):
    area: str = ""
    role: str = ""
    impact: str = ""
    stakeholders: str = ""


class CapabilityResponse(BaseModel):
    capability_id: str
    current_level: str = ""  # Below / At / Exceeds
    current_rationale: str = ""
    demonstrated_next: bool = False
    rationale: str = ""


class EmployeeForm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    contributions: List[Contribution] = Field(default_factory=list)
    capability_responses: List[CapabilityResponse] = Field(default_factory=list)
    overall_reflection: str = ""
    status: Literal["draft", "submitted"] = "draft"
    submitted_at: Optional[str] = None
    updated_at: str = Field(default_factory=_now)


class StakeholderRow(BaseModel):
    name: str = ""
    email: str = ""
    relationship: str = ""


class ManagerForm(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    capability_responses: List[CapabilityResponse] = Field(default_factory=list)
    stakeholders: List[StakeholderRow] = Field(default_factory=list)
    overall_rationale: str = ""
    readiness: Literal["", "strong", "moderate", "weak"] = ""
    status: Literal["draft", "submitted"] = "draft"
    submitted_at: Optional[str] = None
    updated_at: str = Field(default_factory=_now)


class StakeholderFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    stakeholder_name: str
    stakeholder_email: str = ""
    capability_responses: List[CapabilityResponse] = Field(default_factory=list)
    comments: str = ""
    status: Literal["draft", "submitted"] = "draft"
    submitted_at: Optional[str] = None
    updated_at: str = Field(default_factory=_now)


class PanelCapabilityRating(BaseModel):
    capability_id: str
    rating: str = ""  # Strong / Moderate / Weak / Mixed
    rationale: str = ""


class PanelReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    panel_member_id: str
    capability_ratings: List[PanelCapabilityRating] = Field(default_factory=list)
    overall_rating: Literal["", "strong", "moderate", "weak"] = ""
    overall_rationale: str = ""
    discussion_notes: str = ""
    status: Literal["draft", "submitted"] = "draft"
    submitted_at: Optional[str] = None
    updated_at: str = Field(default_factory=_now)


class HRReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    overall_summary: str = ""
    additional_feedback: str = ""
    development_plan: str = ""
    readiness: Literal["", "strong", "moderate", "weak"] = ""
    status: Literal["draft", "submitted"] = "draft"
    submitted_at: Optional[str] = None
    updated_at: str = Field(default_factory=_now)


# ---------- Documents ----------
DocumentType = Literal[
    "org_chart", "talent_scorecard", "psychometric_pdf", "annual_review",
    "mid_review", "data_summary", "presentation", "profile",
    "intune_scorecard", "360_report", "360_summary",
]


class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: str
    doc_type: str
    original_filename: str
    storage_path: str
    content_type: str
    size: int
    version: int = 1
    is_latest: bool = True
    uploaded_by: str
    uploaded_at: str = Field(default_factory=_now)
    is_deleted: bool = False
    parsed_text: Optional[str] = None


# ---------- AI ----------
class AIAnalysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: Optional[str] = None
    analysis_type: str
    prompt_version: str = "v1"
    model_name: str = "claude-sonnet-4-5-20250929"
    content: str = ""
    structured: Dict[str, Any] = Field(default_factory=dict)
    created_by: str
    created_at: str = Field(default_factory=_now)


class AIWriteRequest(BaseModel):
    text: str
    mode: Literal["rewrite", "improve", "short", "detailed"] = "improve"
    context: Optional[str] = None


class AIAnalyzeRequest(BaseModel):
    case_id: str
    analysis_type: Literal[
        "integrated_summary", "capability_gap", "bias_check",
        "panel_draft", "hr_draft", "development_plan",
        "document_summary", "quick_brief", "stakeholder_suggest"
    ]
    extra: Dict[str, Any] = Field(default_factory=dict)


# ---------- Audit ----------
class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_uuid)
    case_id: Optional[str] = None
    user_id: str
    user_name: str
    action: str
    entity: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=_now)
