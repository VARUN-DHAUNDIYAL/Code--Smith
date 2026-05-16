-- Add Analytics Models

-- Create ProjectMetrics model
CREATE TYPE "MetricType" AS ENUM ('CODE_QUALITY', 'PERFORMANCE', 'COLLABORATION', 'AI_USAGE');

-- Create ProjectMetrics model
MODEL ProjectMetrics {
  id           String     @id @default(cuid()) @map("_id")
  playgroundId String
  metricType   MetricType
  metricName   String
  metricValue  Float
  timestamp    DateTime   @default(now())

  playground   Playground @relation(fields: [playgroundId], references: [id], onDelete: Cascade)

  @@index([playgroundId])
  @@index([metricType])
  @@index([timestamp])
}

-- Create UserProductivity model
MODEL UserProductivity {
  id           String   @id @default(cuid()) @map("_id")
  userId       String
  playgroundId String
  activityType String   // 'CODE_EDIT', 'AI_USAGE', 'COLLABORATION', 'GIT_OPERATION'
  duration     Int      // Duration in seconds
  timestamp    DateTime @default(now())

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  playground   Playground @relation(fields: [playgroundId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([playgroundId])
  @@index([timestamp])
}

-- Create CodeQualityMetrics model
MODEL CodeQualityMetrics {
  id           String   @id @default(cuid()) @map("_id")
  playgroundId String
  fileId       String?
  linesOfCode  Int?
  complexity   Float?
  duplications Float?
  bugs         Int?
  vulnerabilities Int?
  codeSmells   Int?
  timestamp    DateTime @default(now())

  playground   Playground @relation(fields: [playgroundId], references: [id], onDelete: Cascade)

  @@index([playgroundId])
  @@index([timestamp])
}

-- Create AIUsageMetrics model
MODEL AIUsageMetrics {
  id             String   @id @default(cuid()) @map("_id")
  userId         String
  playgroundId   String
  suggestionType String   // 'CODE_COMPLETION', 'ERROR_FIX', 'REFACTORING', 'DOCUMENTATION'
  accepted       Boolean
  timestamp      DateTime @default(now())

  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  playground     Playground @relation(fields: [playgroundId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([playgroundId])
  @@index([timestamp])
}