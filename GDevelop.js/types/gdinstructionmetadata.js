// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdInstructionMetadata {
  constructor(): void;
  getFullName(): string;
  getDescription(): string;
  getSentence(): string;
  getGroup(): string;
  getIconFilename(): string;
  getSmallIconFilename(): string;
  getHelpPath(): string;
  canHaveSubInstructions(): boolean;
  getParameter(index: number): gdParameterMetadata;
  getParametersCount(): number;
  getParameters(): gdVectorParameterMetadata;
  getUsageComplexity(): number;
  isHidden(): boolean;
  isPrivate(): boolean;
  isAsync(): boolean;
  isOptionallyAsync(): boolean;
  setCanHaveSubInstructions(): gdInstructionMetadata;
  setHelpPath(helpPath: string): gdInstructionMetadata;
  setHidden(): gdInstructionMetadata;
  setPrivate(): gdInstructionMetadata;
  addParameter(type: string, description: string, optionalObjectType?: string, parameterIsOptional?: boolean): gdInstructionMetadata;
  addCodeOnlyParameter(type: string, supplementaryInformation: string): gdInstructionMetadata;
  setDefaultValue(defaultValue: string): gdInstructionMetadata;
  setParameterLongDescription(longDescription: string): gdInstructionMetadata;
  setParameterExtraInfo(extraInfo: string): gdInstructionMetadata;
  useStandardOperatorParameters(type: string, typeExtraInfo?: string): gdInstructionMetadata;
  useStandardRelationalOperatorParameters(type: string, typeExtraInfo?: string): gdInstructionMetadata;
  setRequiresBaseObjectCapability(capability: string): gdInstructionMetadata;
  getRequiredBaseObjectCapability(): string;
  markAsSimple(): gdInstructionMetadata;
  markAsAdvanced(): gdInstructionMetadata;
  markAsComplex(): gdInstructionMetadata;
  getCodeExtraInformation(): gdExtraInformation;
  setFunctionName(functionName: string): gdExtraInformation;
  setIncludeFile(includeFile: string): gdInstructionMetadata;
  addIncludeFile(includeFile: string): gdInstructionMetadata;
  getIncludeFiles(): gdVectorString;
  delete(): void;
  ptr: number;
};