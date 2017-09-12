import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BackendResource } from '../decorators/backend-resource.decorator';
import { Account } from '../models/account.model';
import { BaseBackendService } from './base-backend.service';
import { CacheService } from './cache.service';
import { ErrorService } from './error.service';

@Injectable()
@BackendResource({
  entity: 'Account',
  entityModel: Account
})
export class AccountService extends BaseBackendService<Account> {
  constructor(
    public errorService: ErrorService,
    public http: HttpClient,
    public cacheService: CacheService
  ) {
    super(cacheService, errorService, http);
  }
}
