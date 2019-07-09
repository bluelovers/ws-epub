import { IOptions } from './txt2epub3';
import { EpubMaker } from 'epub-maker2';
import { EpubStore } from './store';
import { IAttachMetaData, IEpubRuntimeReturn } from './epub';
export interface IInternalProcessOptions {
    store: EpubStore;
    epub: EpubMaker;
    epubOptions: IOptions;
    cwd: string;
}
export interface IInternalProcessContextOptions extends IInternalProcessOptions {
    vid: string;
    attach: IAttachMetaData;
}
export interface IInternalProcessVolumeOptions extends Omit<IInternalProcessOptions, 'cwd'> {
    processReturn: Partial<IEpubRuntimeReturn>;
    cwd?: string;
}
