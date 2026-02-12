declare module 'html-to-docx' {
    export default function HTMLtoDOCX(
        htmlString: string,
        headerHTMLString?: string,
        documentOptions?: any,
        footerHTMLString?: string
    ): Promise<Buffer>;
}
