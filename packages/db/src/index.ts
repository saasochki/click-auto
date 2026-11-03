import { v7 as uuidv7 } from 'uuid';

export * from '@prisma/client';

/** All primary keys are UUID v7: time-ordered, friendly to B-tree indexes. */
export const newId = (): string => uuidv7();
