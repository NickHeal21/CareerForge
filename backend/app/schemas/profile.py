from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ProfileUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=30)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = Field(default=None, max_length=2000)
    tenth_percentage: float | None = Field(default=None, ge=0, le=100)
    twelfth_percentage: float | None = Field(default=None, ge=0, le=100)
    ug_degree: str | None = Field(default=None, max_length=150)
    ug_cgpa: float | None = Field(default=None, ge=0, le=10)
    pg_degree: str | None = Field(default=None, max_length=150)
    pg_cgpa: float | None = Field(default=None, ge=0, le=10)
    skills: str | None = Field(default=None, max_length=5000)
    linkedin_url: HttpUrl | None = None
    github_url: HttpUrl | None = None
    leetcode_url: HttpUrl | None = None
    portfolio_url: HttpUrl | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    user_id: int
    profile_image: str | None = None
    phone: str | None = None
    location: str | None = None
    bio: str | None = None
    tenth_percentage: float | None = None
    twelfth_percentage: float | None = None
    ug_degree: str | None = None
    ug_cgpa: float | None = None
    pg_degree: str | None = None
    pg_cgpa: float | None = None
    skills: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    leetcode_url: str | None = None
    portfolio_url: str | None = None
