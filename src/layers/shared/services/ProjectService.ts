import { ProjectType } from "@ddb/schema.js";
import { BaseService } from "./BaseService.js";
import { Model } from "dynamodb-onetable";
import { NotFoundError } from "../errors/errors.js";

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
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found`);
    }
    return project;
  }

  /**
   * Get all projects.
   * To-do: add query params
   */
  public async getProjects(query: Record<string, unknown>, model?: Model<ProjectType>): Promise<ProjectType[]> {
    const client = this.getClient(model);
    return await client.find(query);
  }

  /**
   * Delete a project.
   */
  public async deleteProject(projectId: string, model?: Model<ProjectType>): Promise<void> {
    await this.getClient(model).remove({ project_id: projectId });
  }
}
