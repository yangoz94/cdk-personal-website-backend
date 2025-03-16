import { ProjectType } from "@ddb/schema.js";
import { BaseService } from "./BaseService.js";
import { Model } from "dynamodb-onetable";
import { BadRequestError, NotFoundError } from "../errors/errors.js";

export class ProjectService extends BaseService {
  private projectModel: Model<ProjectType>;

  constructor() {
    super();
    this.projectModel = this.ddbInstance.getModel("Project");
  }

  /**
   * Retrieve the model client, supports transactions if provided.
   */
  private getClient(model?: Model<ProjectType>): Model<ProjectType> {
    return model ?? this.projectModel;
  }

  /**
   * Create a new project.
   */
  public async createProject(project: ProjectType, model?: Model<ProjectType>): Promise<ProjectType> {
    const client = this.getClient(model);
    await client.create(project);
    return project;
  }

  /**
   * Get a project by its ID.
   */
  public async getProjectById(projectId: string, model?: Model<ProjectType>): Promise<ProjectType | null> {
    const client = this.getClient(model);
    const project = await client.get({ project_id: projectId });
    return project || null;
  }

  /**
   * Get projects with pagination.
   */
  public async getProjects(limit: number, lastKey?: string, model?: Model<ProjectType>): Promise<{ projects: ProjectType[]; lastEvaluatedKey?: string }> {
    const client = this.getClient(model);
    let next: any;

    if (lastKey) {
      try {
        next = JSON.parse(Buffer.from(lastKey, "base64").toString("utf8"));
      } catch (error) {
        throw new BadRequestError("Invalid last key");
      }
    }

    const projects = await client.find({ APIPK: "PROJECT" }, { index: "AllProjectsIndex", limit, next });

    const lastEvaluatedKey = projects.next ? Buffer.from(JSON.stringify(projects.next)).toString("base64") : undefined;

    return { projects: projects, lastEvaluatedKey };
  }

  /**
   * Delete a project.
   */
  public async deleteProject(projectId: string, model?: Model<ProjectType>): Promise<void> {
    await this.getClient(model).remove({ project_id: projectId });
  }
}
