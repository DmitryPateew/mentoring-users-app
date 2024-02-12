import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialsListComponent } from '../materials-list/materials-list.component';
import { MaterialsFacade } from '@users/materials/data-access';
import { LetDirective } from '@ngrx/component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddFolderModalComponent } from '../add-folder-modal/add-folder-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DeleteFolderModalComponent } from '../delete-folder-modal/delete-folder-modal.component';
import { tap } from 'rxjs';
import { MaterialsService } from '../../../../service/materialsService';

@Component({
  selector: 'lib-materials-list-container',
  standalone: true,
  imports: [CommonModule, MaterialsListComponent, LetDirective, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './materials-list-container.component.html',
  styleUrls: ['./materials-list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialsListContainerComponent {
  private readonly materialsFacade = inject(MaterialsFacade);
  public readonly folders$ = this.materialsFacade.folders$;
  public readonly isLoading$ = this.materialsFacade.isLoading$;
  public dialog = inject(MatDialog);
  private materialService = inject(MaterialsService);
  private readonly destroyRef = inject(DestroyRef);
  public folderName!: string;

  constructor(public snackBar: MatSnackBar) {
    this.materialsFacade.init();

    this.materialService.folderId.pipe(
      tap(folderId => {
          if (!folderId) return;
          this.deleteFolder(folderId);
        }
      )
    ).subscribe();
  }

  private openSnackBar(snackBarLabel: string): void {
    this.snackBar.open(snackBarLabel,
      'Dismiss', {
        duration: 3000
      });
  }

  openAddFolderDialog(): void {
    const addFolderRef: MatDialogRef<AddFolderModalComponent> = this.dialog.open(AddFolderModalComponent, {
      data: { folderName: this.folderName }
    });
    addFolderRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(
        tap(({ folderName }) => {
          this.materialsFacade.addNewFolder(folderName);
          this.openSnackBar(`Folder ${folderName} was added`);
        })
      )
      .subscribe();
  }

  deleteFolder(folderId: number) {
    const deleteFolderRef: MatDialogRef<DeleteFolderModalComponent> = this.dialog.open(DeleteFolderModalComponent);
    deleteFolderRef.afterClosed()
      .pipe(
        tap(confirmDelete => {
          if (!confirmDelete) return;
          this.materialsFacade.deleteFolder(folderId);
          this.openSnackBar(`Folder ${folderId} was removed`);
          this.materialService.setFolderId(0);
        })
      )
      .subscribe();
  }
}
