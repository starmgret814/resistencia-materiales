declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"resistencia": {
"01-esfuerzos-falla/falla-y-factor-de-seguridad/index.mdx": {
	id: "01-esfuerzos-falla/falla-y-factor-de-seguridad/index.mdx";
  slug: "01-esfuerzos-falla/falla-y-factor-de-seguridad";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/fundamentos-del-esfuerzo/index.mdx": {
	id: "01-esfuerzos-falla/fundamentos-del-esfuerzo/index.mdx";
  slug: "01-esfuerzos-falla/fundamentos-del-esfuerzo";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/problemas/index.mdx": {
	id: "01-esfuerzos-falla/problemas/index.mdx";
  slug: "01-esfuerzos-falla/problemas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/prueba-2/index.mdx": {
	id: "01-esfuerzos-falla/prueba-2/index.mdx";
  slug: "01-esfuerzos-falla/prueba-2";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/resistencia-y-seguridad/index.mdx": {
	id: "01-esfuerzos-falla/resistencia-y-seguridad/index.mdx";
  slug: "01-esfuerzos-falla/resistencia-y-seguridad";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/subtema-inicial/index.mdx": {
	id: "01-esfuerzos-falla/subtema-inicial/index.mdx";
  slug: "01-esfuerzos-falla/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"01-esfuerzos-falla/xd/index.mdx": {
	id: "01-esfuerzos-falla/xd/index.mdx";
  slug: "01-esfuerzos-falla/xd";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"02-deformaciones-ley-hooke/concepto-de-deformacion/index.mdx": {
	id: "02-deformaciones-ley-hooke/concepto-de-deformacion/index.mdx";
  slug: "02-deformaciones-ley-hooke/concepto-de-deformacion";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"02-deformaciones-ley-hooke/deformacion-de-elementos-sometidos-a-carga-axial/index.mdx": {
	id: "02-deformaciones-ley-hooke/deformacion-de-elementos-sometidos-a-carga-axial/index.mdx";
  slug: "02-deformaciones-ley-hooke/deformacion-de-elementos-sometidos-a-carga-axial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"02-deformaciones-ley-hooke/efecto-poisson-y-estado-multiaxial/index.mdx": {
	id: "02-deformaciones-ley-hooke/efecto-poisson-y-estado-multiaxial/index.mdx";
  slug: "02-deformaciones-ley-hooke/efecto-poisson-y-estado-multiaxial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"02-deformaciones-ley-hooke/problemas/index.mdx": {
	id: "02-deformaciones-ley-hooke/problemas/index.mdx";
  slug: "02-deformaciones-ley-hooke/problemas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"02-deformaciones-ley-hooke/subtema-inicial/index.mdx": {
	id: "02-deformaciones-ley-hooke/subtema-inicial/index.mdx";
  slug: "02-deformaciones-ley-hooke/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"03-cambio-temperatura-hiperestaticos/3-11-problemas-resueltos/index.mdx": {
	id: "03-cambio-temperatura-hiperestaticos/3-11-problemas-resueltos/index.mdx";
  slug: "03-cambio-temperatura-hiperestaticos/3-11-problemas-resueltos";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"03-cambio-temperatura-hiperestaticos/cambios-de-temperatura/index.mdx": {
	id: "03-cambio-temperatura-hiperestaticos/cambios-de-temperatura/index.mdx";
  slug: "03-cambio-temperatura-hiperestaticos/cambios-de-temperatura";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"03-cambio-temperatura-hiperestaticos/cambios-de-temperaturas/index.mdx": {
	id: "03-cambio-temperatura-hiperestaticos/cambios-de-temperaturas/index.mdx";
  slug: "03-cambio-temperatura-hiperestaticos/cambios-de-temperaturas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"03-cambio-temperatura-hiperestaticos/subtema-inicial/index.mdx": {
	id: "03-cambio-temperatura-hiperestaticos/subtema-inicial/index.mdx";
  slug: "03-cambio-temperatura-hiperestaticos/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"04-transformacion-esfuerzos/subtema-inicial/index.mdx": {
	id: "04-transformacion-esfuerzos/subtema-inicial/index.mdx";
  slug: "04-transformacion-esfuerzos/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"04-transformacion-esfuerzos/transformacion-de-deformaciones/index.mdx": {
	id: "04-transformacion-esfuerzos/transformacion-de-deformaciones/index.mdx";
  slug: "04-transformacion-esfuerzos/transformacion-de-deformaciones";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"05-recipientes-presion/problemas/index.mdx": {
	id: "05-recipientes-presion/problemas/index.mdx";
  slug: "05-recipientes-presion/problemas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"05-recipientes-presion/recipientes-cilindricos/index.mdx": {
	id: "05-recipientes-presion/recipientes-cilindricos/index.mdx";
  slug: "05-recipientes-presion/recipientes-cilindricos";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"05-recipientes-presion/subtema-inicial/index.mdx": {
	id: "05-recipientes-presion/subtema-inicial/index.mdx";
  slug: "05-recipientes-presion/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/deformaciones-de-ejes/index.mdx": {
	id: "06-torsion/deformaciones-de-ejes/index.mdx";
  slug: "06-torsion/deformaciones-de-ejes";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/diseno-de-ejes-y-transmision-de-potencia/index.mdx": {
	id: "06-torsion/diseno-de-ejes-y-transmision-de-potencia/index.mdx";
  slug: "06-torsion/diseno-de-ejes-y-transmision-de-potencia";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/ejes-compuestos-y-estaticamente-indeterminados/index.mdx": {
	id: "06-torsion/ejes-compuestos-y-estaticamente-indeterminados/index.mdx";
  slug: "06-torsion/ejes-compuestos-y-estaticamente-indeterminados";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/problemas-resueltos/index.mdx": {
	id: "06-torsion/problemas-resueltos/index.mdx";
  slug: "06-torsion/problemas-resueltos";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/subtema-inicial/index.mdx": {
	id: "06-torsion/subtema-inicial/index.mdx";
  slug: "06-torsion/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"06-torsion/tubos-de-pared-delgada-y-concentracion-de-esfuerzos/index.mdx": {
	id: "06-torsion/tubos-de-pared-delgada-y-concentracion-de-esfuerzos/index.mdx";
  slug: "06-torsion/tubos-de-pared-delgada-y-concentracion-de-esfuerzos";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"07-flexion-cortante/distribucion-de-esfuerzos--ecuacion-de-la-flexion-y-momento-de-inercia/index.mdx": {
	id: "07-flexion-cortante/distribucion-de-esfuerzos--ecuacion-de-la-flexion-y-momento-de-inercia/index.mdx";
  slug: "07-flexion-cortante/distribucion-de-esfuerzos--ecuacion-de-la-flexion-y-momento-de-inercia";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"07-flexion-cortante/flexion-pura-y-cinematica-de-la-deformacion/index.mdx": {
	id: "07-flexion-cortante/flexion-pura-y-cinematica-de-la-deformacion/index.mdx";
  slug: "07-flexion-cortante/flexion-pura-y-cinematica-de-la-deformacion";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"07-flexion-cortante/fuerzas-internas-en-vigas---diagramas-de-fuerza-cortante-y-momento-flector/index.mdx": {
	id: "07-flexion-cortante/fuerzas-internas-en-vigas---diagramas-de-fuerza-cortante-y-momento-flector/index.mdx";
  slug: "07-flexion-cortante/fuerzas-internas-en-vigas---diagramas-de-fuerza-cortante-y-momento-flector";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"07-flexion-cortante/problemas-resueltos/index.mdx": {
	id: "07-flexion-cortante/problemas-resueltos/index.mdx";
  slug: "07-flexion-cortante/problemas-resueltos";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"07-flexion-cortante/subtema-inicial/index.mdx": {
	id: "07-flexion-cortante/subtema-inicial/index.mdx";
  slug: "07-flexion-cortante/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/8-2-ejes-principales/index.mdx": {
	id: "08-flexion-asimetrica/8-2-ejes-principales/index.mdx";
  slug: "08-flexion-asimetrica/8-2-ejes-principales";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/8-3-circulo-de-mohr/index.mdx": {
	id: "08-flexion-asimetrica/8-3-circulo-de-mohr/index.mdx";
  slug: "08-flexion-asimetrica/8-3-circulo-de-mohr";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/8-3-primer-metodo/index.mdx": {
	id: "08-flexion-asimetrica/8-3-primer-metodo/index.mdx";
  slug: "08-flexion-asimetrica/8-3-primer-metodo";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/8-4-segundo-metodo/index.mdx": {
	id: "08-flexion-asimetrica/8-4-segundo-metodo/index.mdx";
  slug: "08-flexion-asimetrica/8-4-segundo-metodo";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/problemas-para-practicar/index.mdx": {
	id: "08-flexion-asimetrica/problemas-para-practicar/index.mdx";
  slug: "08-flexion-asimetrica/problemas-para-practicar";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/subtema-inicial/index.mdx": {
	id: "08-flexion-asimetrica/subtema-inicial/index.mdx";
  slug: "08-flexion-asimetrica/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"08-flexion-asimetrica/tablas/index.mdx": {
	id: "08-flexion-asimetrica/tablas/index.mdx";
  slug: "08-flexion-asimetrica/tablas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/9-2-fundamentos-matematicos-y-deduccion-de-la-curva-elastica/index.mdx": {
	id: "09-deflexion-integracion/9-2-fundamentos-matematicos-y-deduccion-de-la-curva-elastica/index.mdx";
  slug: "09-deflexion-integracion/9-2-fundamentos-matematicos-y-deduccion-de-la-curva-elastica";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/formulario/index.mdx": {
	id: "09-deflexion-integracion/formulario/index.mdx";
  slug: "09-deflexion-integracion/formulario";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/funciones-de-discontinuidad-y-singularidad--metodo-de-macaulay-/index.mdx": {
	id: "09-deflexion-integracion/funciones-de-discontinuidad-y-singularidad--metodo-de-macaulay-/index.mdx";
  slug: "09-deflexion-integracion/funciones-de-discontinuidad-y-singularidad--metodo-de-macaulay-";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/metodos-de-integracion-directa--2--y-4--orden--/index.mdx": {
	id: "09-deflexion-integracion/metodos-de-integracion-directa--2--y-4--orden--/index.mdx";
  slug: "09-deflexion-integracion/metodos-de-integracion-directa--2--y-4--orden--";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/resolucion-de-problemas/index.mdx": {
	id: "09-deflexion-integracion/resolucion-de-problemas/index.mdx";
  slug: "09-deflexion-integracion/resolucion-de-problemas";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/subtema-inicial/index.mdx": {
	id: "09-deflexion-integracion/subtema-inicial/index.mdx";
  slug: "09-deflexion-integracion/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"09-deflexion-integracion/vigas-hiperestaticas-y-principio-de-superposicion/index.mdx": {
	id: "09-deflexion-integracion/vigas-hiperestaticas-y-principio-de-superposicion/index.mdx";
  slug: "09-deflexion-integracion/vigas-hiperestaticas-y-principio-de-superposicion";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"10-funciones-discontinuidad/subtema-inicial/index.mdx": {
	id: "10-funciones-discontinuidad/subtema-inicial/index.mdx";
  slug: "10-funciones-discontinuidad/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"11-vigas-hiperestaticas/subtema-inicial/index.mdx": {
	id: "11-vigas-hiperestaticas/subtema-inicial/index.mdx";
  slug: "11-vigas-hiperestaticas/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"12-columnas/subtema-inicial/index.mdx": {
	id: "12-columnas/subtema-inicial/index.mdx";
  slug: "12-columnas/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
"13-formula-secante/subtema-inicial/index.mdx": {
	id: "13-formula-secante/subtema-inicial/index.mdx";
  slug: "13-formula-secante/subtema-inicial";
  body: string;
  collection: "resistencia";
  data: any
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}
