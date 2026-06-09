import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import { getClassIdsWithUpcomingScheduledInstances } from "../../lib/upcoming-instances";
import { activeEnrollmentFilter } from "../../lib/enrollment-scope";
import type {
  CreateClientInput,
  UpdateClientInput,
  ListClientsQuery,
} from "./client.validation";

const activeFilter = { deletedAt: null };

const DEFAULT_PAGE_SIZE = 20;

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function listClientsWhere(
  instructorId: string,
  query?: ListClientsQuery
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    instructorId,
    ...activeFilter,
  };

  if (query?.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function createClient(instructorId: string, input: CreateClientInput) {
  const email = input.email.trim();

  const existing = await prisma.client.findFirst({
    where: { instructorId, email, ...activeFilter },
  });
  if (existing) {
    throw new ConflictError("A client with this email already exists");
  }

  return prisma.client.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: normalizeOptionalString(input.phone),
      injuries: normalizeOptionalString(input.injuries),
      focusAreas: normalizeOptionalString(input.focusAreas),
      goals: normalizeOptionalString(input.goals),
      instructorId,
    },
  });
}

export async function listClients(instructorId: string, query: ListClientsQuery) {
  const where = listClientsWhere(instructorId, query);
  const limit = Math.min(query.limit ?? DEFAULT_PAGE_SIZE, 100);
  const page = query.page;
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            enrollments: { where: activeEnrollmentFilter },
            attendances: true,
          },
        },
      },
    }),
  ]);

  return { data, total, page, limit };
}

const clientDetailInclude = {
  enrollments: {
    where: activeEnrollmentFilter,
    orderBy: { enrolledAt: "desc" as const },
    include: {
      class: {
        select: {
          id: true,
          title: true,
          type: true,
          durationMinutes: true,
          deletedAt: true,
        },
      },
    },
  },
  _count: { select: { attendances: true } },
} as const;

export async function getClientById(clientId: string, instructorId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, instructorId, ...activeFilter },
    include: clientDetailInclude,
  });

  if (!client) throw new NotFoundError("Client");

  const enrollments = client.enrollments.filter((e) => e.class.deletedAt === null);
  const upcomingClassIds = await getClassIdsWithUpcomingScheduledInstances(
    enrollments.map((enrollment) => enrollment.classId)
  );

  return {
    ...client,
    enrollments: enrollments.map((enrollment) => ({
      ...enrollment,
      canUnenroll: upcomingClassIds.has(enrollment.classId),
    })),
  };
}

export async function updateClient(
  clientId: string,
  instructorId: string,
  input: UpdateClientInput
) {
  const existing = await prisma.client.findFirst({
    where: { id: clientId, instructorId, ...activeFilter },
  });
  if (!existing) throw new NotFoundError("Client");

  const email = input.email.trim();

  if (email !== existing.email) {
    const duplicate = await prisma.client.findFirst({
      where: {
        instructorId,
        email,
        ...activeFilter,
        NOT: { id: clientId },
      },
    });
    if (duplicate) {
      throw new ConflictError("A client with this email already exists");
    }
  }

  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.firstName !== undefined && { firstName: input.firstName.trim() }),
      ...(input.lastName !== undefined && { lastName: input.lastName.trim() }),
      email,
      ...(input.phone !== undefined && { phone: normalizeOptionalString(input.phone) }),
      ...(input.injuries !== undefined && {
        injuries: normalizeOptionalString(input.injuries),
      }),
      ...(input.focusAreas !== undefined && {
        focusAreas: normalizeOptionalString(input.focusAreas),
      }),
      ...(input.goals !== undefined && { goals: normalizeOptionalString(input.goals) }),
    },
    include: clientDetailInclude,
  });
}

export async function deleteClients(clientIds: string[], instructorId: string) {
  const uniqueIds = [...new Set(clientIds)];
  if (uniqueIds.length === 0) {
    throw new ValidationError("At least one client is required");
  }

  const clients = await prisma.client.findMany({
    where: { id: { in: uniqueIds }, instructorId, ...activeFilter },
    select: { id: true },
  });
  const foundIds = new Set(clients.map((client) => client.id));
  const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new NotFoundError("Client");
  }

  const result = await prisma.client.updateMany({
    where: { id: { in: uniqueIds }, instructorId, ...activeFilter },
    data: { deletedAt: new Date() },
  });

  return {
    removed: result.count,
    message:
      result.count === 1 ? "Client archived" : `${result.count} clients archived`,
  };
}

export async function deleteClient(clientId: string, instructorId: string) {
  return deleteClients([clientId], instructorId);
}
