// Minimal fallback Supabase types for development.
// This file exists to provide a `Database` type when the generated
// types are missing or have been corrupted. It's intentionally permissive
// (Row/Insert/Update are `any`) so it won't block development. For full
// type-safety, regenerate types with the Supabase CLI and replace this file.

export type Json = any;

export type Database = {
	public: {
		Tables: {
			[table: string]: {
				Row: any;
				Insert: any;
				Update: any;
				Relationships?: Array<any>;
			};
		};
		Views: Record<string, any>;
		Functions: Record<string, any>;
		Enums: Record<string, any>;
		CompositeTypes: Record<string, any>;
	};
};

export default Database;